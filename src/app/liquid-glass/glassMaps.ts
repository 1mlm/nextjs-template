const GLASS_REFRACTIVE_INDEX = 1.5;
const NEUTRAL_CHANNEL = 128;
const LIGHT_DIRECTION = { x: -Math.SQRT1_2, y: -Math.SQRT1_2 };
const NORMAL_STEP_PX = 0.5;
// past 2x the maps get big enough to drop frames while dragging, and nobody
// can see the difference
const MAX_MAP_SCALE = 2;

export type GlassRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
};

export type GlassSettings = {
  // how tall the glass is, more = rays drift further at the rim
  thickness: number;
  // how wide the curved rim is before the glass goes flat
  bezel: number;
  // blur on what's behind before it gets bent, softens hard contrast at the rim
  frost: number;
  // corner superellipse exponent, 2 = circle, 4 = squircle, higher = boxier
  cornerExponent: number;
  // how far apart two pieces of glass start melting into each other
  mergeDistance: number;
};

// squircle rim: rises steep at the edge then flattens out, so the bend fades
// in smoothly. a plain circular arc makes one harsh ring with dead glass
// inside, the hollow donut look
const getSquircleHeight = (progress: number) =>
  (1 - (1 - progress) ** 4) ** 0.25;

// a vertical ray hits the sloped rim, bends toward the surface normal
// (snell), then travels down through the glass. the sideways drift by the
// time it reaches the bottom is how far the background looks shifted
function getRayShiftAtRim(progress: number, thickness: number, bezel: number) {
  const step = 0.001;
  const clampedProgress = Math.min(Math.max(progress, step), 1 - step);
  const slope =
    ((getSquircleHeight(clampedProgress + step) -
      getSquircleHeight(clampedProgress - step)) /
      (2 * step)) *
    (thickness / bezel);
  const incidenceAngle = Math.atan(slope);
  const refractedAngle = Math.asin(
    Math.sin(incidenceAngle) / GLASS_REFRACTIVE_INDEX,
  );
  const glassDepth = getSquircleHeight(clampedProgress) * thickness;
  return glassDepth * Math.tan(incidenceAngle - refractedAngle);
}

// signed distance to a rounded rect (negative inside) whose corners are
// superellipses instead of circle arcs, same curve as css corner-shape
function getRectDistance(
  pointX: number,
  pointY: number,
  rect: GlassRect,
  cornerExponent: number,
) {
  const radius = Math.min(rect.radius, rect.width / 2, rect.height / 2);
  const cornerX =
    Math.abs(pointX - rect.x - rect.width / 2) - (rect.width / 2 - radius);
  const cornerY =
    Math.abs(pointY - rect.y - rect.height / 2) - (rect.height / 2 - radius);
  const outsideX = Math.max(cornerX, 0);
  const outsideY = Math.max(cornerY, 0);
  const cornerDistance =
    (outsideX ** cornerExponent + outsideY ** cornerExponent) **
    (1 / cornerExponent);
  return cornerDistance + Math.min(Math.max(cornerX, cornerY), 0) - radius;
}

// polynomial smooth min, two shapes closer than mergeDistance get a gooey
// bridge between them instead of a hard crease
function getSmoothMin(a: number, b: number, mergeDistance: number) {
  if (mergeDistance <= 0) return Math.min(a, b);
  const blend = Math.max(mergeDistance - Math.abs(a - b), 0) / mergeDistance;
  return Math.min(a, b) - (blend * blend * mergeDistance) / 4;
}

function getUnionDistance(
  pointX: number,
  pointY: number,
  rects: GlassRect[],
  { cornerExponent, mergeDistance }: GlassSettings,
) {
  return rects
    .map((rect) => getRectDistance(pointX, pointY, rect, cornerExponent))
    .reduce((union, distance) => getSmoothMin(union, distance, mergeDistance));
}

// fades the bend in over the first couple px so the rim doesn't snap from
// untouched background straight to a big shift, that snap is what looks crisp
const getEdgeFadeIn = (depth: number) => Math.min(1, depth / 3) ** 2;

function imageDataToUrl(imageData: ImageData) {
  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  canvas.getContext("2d")?.putImageData(imageData, 0, 0);
  return canvas.toDataURL();
}

// three images for one blob of glass (any number of melted rects):
// - displacement: what feDisplacementMap reads (red = x shift, green = y
//   shift, 128 = none)
// - specular: the white rim light
// - mask: the antialiased shape itself, so edges are smooth at any zoom
export function drawGlassMaps(
  rects: GlassRect[],
  width: number,
  height: number,
  settings: GlassSettings,
) {
  const { thickness, bezel } = settings;
  const scale = Math.min(window.devicePixelRatio || 1, MAX_MAP_SCALE);
  const pixelWidth = Math.ceil(width * scale);
  const pixelHeight = Math.ceil(height * scale);
  const shiftByDepth = Array.from({ length: Math.ceil(bezel) + 1 }, (_, px) =>
    getRayShiftAtRim(px / bezel, thickness, bezel),
  );
  const maxShift = Math.max(...shiftByDepth, 0.001);
  const displacement = new ImageData(pixelWidth, pixelHeight);
  const specular = new ImageData(pixelWidth, pixelHeight);
  const mask = new ImageData(pixelWidth, pixelHeight);
  const getDistance = (x: number, y: number) =>
    getUnionDistance(x, y, rects, settings);

  for (let row = 0; row < pixelHeight; row++)
    for (let column = 0; column < pixelWidth; column++) {
      const index = (row * pixelWidth + column) * 4;
      const x = (column + 0.5) / scale;
      const y = (row + 0.5) / scale;
      const distance = getDistance(x, y);
      const depth = -distance;
      displacement.data[index + 2] = NEUTRAL_CHANNEL;
      displacement.data[index + 3] = 255;
      mask.data[index + 3] =
        255 * Math.min(Math.max(0.5 - distance * scale, 0), 1);
      if (depth <= -1 || depth >= bezel) {
        displacement.data[index] = NEUTRAL_CHANNEL;
        displacement.data[index + 1] = NEUTRAL_CHANNEL;
        continue;
      }

      const gradientX =
        getDistance(x + NORMAL_STEP_PX, y) - getDistance(x - NORMAL_STEP_PX, y);
      const gradientY =
        getDistance(x, y + NORMAL_STEP_PX) - getDistance(x, y - NORMAL_STEP_PX);
      const gradientLength = Math.hypot(gradientX, gradientY) || 1;
      const normalX = gradientX / gradientLength;
      const normalY = gradientY / gradientLength;
      const clampedDepth = Math.max(depth, 0);
      // convex rim pulls rays toward the middle, so each rim pixel shows what
      // sits a bit further inside the glass, never outside it
      const shift =
        (shiftByDepth[Math.round(clampedDepth)] / maxShift) *
        getEdgeFadeIn(clampedDepth);
      displacement.data[index] = NEUTRAL_CHANNEL - normalX * shift * 127;
      displacement.data[index + 1] = NEUTRAL_CHANNEL - normalY * shift * 127;

      // edges facing the light, and the opposite ones catching it on the way
      // out, get a thin bright line like apple's rim
      const facing = Math.abs(
        normalX * LIGHT_DIRECTION.x + normalY * LIGHT_DIRECTION.y,
      );
      const rimFalloff = Math.max(0, 1 - clampedDepth / (bezel * 0.35));
      specular.data[index] = 255;
      specular.data[index + 1] = 255;
      specular.data[index + 2] = 255;
      specular.data[index + 3] =
        255 * (0.25 + 0.75 * facing ** 2) * rimFalloff ** 2 * 0.8;
    }

  return {
    displacementUrl: imageDataToUrl(displacement),
    specularUrl: imageDataToUrl(specular),
    maskUrl: imageDataToUrl(mask),
    // feDisplacementMap moves by scale * (channel - 0.5), so a full 127 step
    // has to land on maxShift px
    displacementScale: maxShift * 2,
  };
}

const getGap = (a: GlassRect, b: GlassRect) =>
  Math.max(
    a.x - (b.x + b.width),
    b.x - (a.x + a.width),
    a.y - (b.y + b.height),
    b.y - (a.y + a.height),
  );

// rects close enough to melt have to share one map (one svg filter, one
// mask), everything else gets its own smaller one. flood fill over "close to"
export function groupMeltingRects<T extends GlassRect>(
  rects: T[],
  mergeDistance: number,
) {
  const groups: T[][] = [];
  const unvisited = new Set(rects);
  for (const start of rects) {
    if (!unvisited.has(start)) continue;
    unvisited.delete(start);
    const group = [start];
    for (const member of group)
      for (const candidate of unvisited)
        if (getGap(member, candidate) < mergeDistance) {
          unvisited.delete(candidate);
          group.push(candidate);
        }
    groups.push(group);
  }
  return groups;
}
