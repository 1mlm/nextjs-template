// the outline of a block as one svg path, built from the measured size of
// its parts. everything is a curve or a straight line, no sharp corners:
// squircle-ish corners, smooth tab shaped connectors, rounded inside corners
// in the mouth of a C block.
//
// how it avoids hairlines between shapes: every shape is drawn with the
// nonzero rule as a union of pieces (clockwise = paint, counter clockwise =
// cut a hole), and whatever sits BEHIND at a seam reaches 1px under whatever
// sits in front (the block above a block, a C block around its insides), so
// a half covered edge pixel always has block color under it, never the canvas

export const SPINE_WIDTH = 16;
const CORNER_RADIUS = 8;
// how square the corners are: 0.55 is a circle, higher is flatter (squircle)
const CORNER_TENSION = 0.8;
const CONNECTOR_WIDTH = 16;
const CONNECTOR_DEPTH = 6;
// the connector sits this far from the left edge, and past the spine for
// the first block inside a C block
export const OUTER_CONNECTOR_X = 12;
export const INNER_CONNECTOR_X = SPINE_WIDTH + OUTER_CONNECTOR_X;
const UNDERLAP = 1;
// bumps are a hair bigger than the holes they fill, same hairline reason
const BUMP_BLEED = 1;

type Corners = { tl: number; tr: number; br: number; bl: number };

const round = (value: number) => Math.round(value * 100) / 100;

// a clockwise rounded rectangle, each corner with its own radius
function getRoundedRect(
  x: number,
  y: number,
  width: number,
  height: number,
  { tl, tr, br, bl }: Corners,
) {
  const k = CORNER_TENSION;
  const right = x + width;
  const bottom = y + height;
  return [
    `M${round(x)} ${round(y + tl)}`,
    `C${round(x)} ${round(y + tl * (1 - k))} ${round(x + tl * (1 - k))} ${round(y)} ${round(x + tl)} ${round(y)}`,
    `L${round(right - tr)} ${round(y)}`,
    `C${round(right - tr * (1 - k))} ${round(y)} ${round(right)} ${round(y + tr * (1 - k))} ${round(right)} ${round(y + tr)}`,
    `L${round(right)} ${round(bottom - br)}`,
    `C${round(right)} ${round(bottom - br * (1 - k))} ${round(right - br * (1 - k))} ${round(bottom)} ${round(right - br)} ${round(bottom)}`,
    `L${round(x + bl)} ${round(bottom)}`,
    `C${round(x + bl * (1 - k))} ${round(bottom)} ${round(x)} ${round(bottom - bl * (1 - k))} ${round(x)} ${round(bottom - bl)}`,
    "Z",
  ].join("");
}

// the tab: a round bowl, tangent to the edge it hangs off at both ends and
// flat only at its very bottom point, so nothing about it is a corner.
// `grow` widens it on every side (the bump) while the hole stays exact
function getConnector(x: number, y: number, isHole: boolean, grow = 0) {
  const left = x - grow;
  const right = x + CONNECTOR_WIDTH + grow;
  const bottom = y + CONNECTOR_DEPTH + grow;
  const top = y;
  const width = right - left;
  const middle = left + width / 2;
  // counter clockwise cuts (hole), clockwise paints (bump)
  return isHole
    ? `M${round(left)} ${round(top)}C${round(left + width * 0.25)} ${round(top)} ${round(left + width * 0.2)} ${round(bottom)} ${round(middle)} ${round(bottom)}C${round(right - width * 0.2)} ${round(bottom)} ${round(right - width * 0.25)} ${round(top)} ${round(right)} ${round(top)}Z`
    : `M${round(right)} ${round(top)}C${round(right - width * 0.25)} ${round(top)} ${round(right - width * 0.2)} ${round(bottom)} ${round(middle)} ${round(bottom)}C${round(left + width * 0.2)} ${round(bottom)} ${round(left + width * 0.25)} ${round(top)} ${round(left)} ${round(top)}Z`;
}

// fills the inside corner where an arm meets the spine, so the mouth of a
// C block has rounded inner corners too. `isTop` = the corner under an arm
function getInnerFillet(x: number, y: number, isTop: boolean) {
  const radius = CORNER_RADIUS - UNDERLAP;
  const k = CORNER_TENSION;
  return isTop
    ? `M${round(x)} ${round(y)}L${round(x + radius)} ${round(y)}C${round(x + radius * (1 - k))} ${round(y)} ${round(x)} ${round(y + radius * (1 - k))} ${round(x)} ${round(y + radius)}Z`
    : `M${round(x)} ${round(y)}L${round(x)} ${round(y - radius)}C${round(x)} ${round(y - radius * (1 - k))} ${round(x + radius * (1 - k))} ${round(y)} ${round(x + radius)} ${round(y)}Z`;
}

export type BlockSectionBox = {
  kind: "arm" | "mouth";
  top: number;
  height: number;
};

// a plain block is one arm, a C block is arm, mouth, arm, (mouth, arm...)
// ending in the foot arm. `hasBlockBelow` = something is stacked right under
// it (then it reaches 1px under that block). stacked blocks meet with square
// corners on the left, so a stack's left edge runs straight without a
// little v of canvas at every join
export function getStatementPath({
  width,
  sections,
  hasBlockAbove,
  hasBlockBelow,
}: {
  width: number;
  sections: BlockSectionBox[];
  hasBlockAbove: boolean;
  hasBlockBelow: boolean;
}) {
  const radius = CORNER_RADIUS;
  const lastIndex = sections.length - 1;
  const shapes = sections.flatMap((section, index) => {
    const isFirst = index === 0;
    const isLast = index === lastIndex;
    const bottom = section.top + section.height;
    if (section.kind === "mouth")
      return [
        // the spine reaches 1px into the mouth, under the blocks inside
        getRoundedRect(0, section.top, SPINE_WIDTH + UNDERLAP, section.height, {
          tl: 0,
          tr: 0,
          br: 0,
          bl: 0,
        }),
        getInnerFillet(SPINE_WIDTH + UNDERLAP, section.top + UNDERLAP, true),
        getInnerFillet(SPINE_WIDTH + UNDERLAP, bottom - UNDERLAP, false),
        // the arm above hands its bump down to the first block inside
        getConnector(INNER_CONNECTOR_X, section.top, false, BUMP_BLEED),
      ];
    const mouthAbove = sections[index - 1]?.kind === "mouth";
    const mouthBelow = sections[index + 1]?.kind === "mouth";
    // an arm sits behind the blocks in the mouths next to it, so it reaches
    // 1px into them, and the whole block reaches under whatever's stacked below
    const top = mouthAbove ? section.top - UNDERLAP : section.top;
    const reachesBelow = mouthBelow || (isLast && hasBlockBelow);
    const height = bottom + (reachesBelow ? UNDERLAP : 0) - top;
    const arm = getRoundedRect(0, top, width, height, {
      tl: isFirst && !hasBlockAbove ? radius : 0,
      tr: radius,
      br: radius,
      bl: isLast && !hasBlockBelow ? radius : 0,
    });
    const hole = isFirst
      ? getConnector(OUTER_CONNECTOR_X, section.top, true)
      : mouthAbove
        ? getConnector(INNER_CONNECTOR_X, section.top, true)
        : undefined;
    const bump = isLast
      ? getConnector(OUTER_CONNECTOR_X, bottom, false, BUMP_BLEED)
      : undefined;
    return [arm, hole, bump].filter((shape) => shape !== undefined);
  });
  return shapes.join("");
}

// the Run hat: a tall rounded cap, no hole (nothing goes above it), a bump
// and a reach under the first block
export function getHatPath(
  width: number,
  height: number,
  hasBlockBelow: boolean,
) {
  return [
    getRoundedRect(0, 0, width, height + UNDERLAP, {
      tl: 16,
      tr: 16,
      br: CORNER_RADIUS,
      bl: hasBlockBelow ? 0 : CORNER_RADIUS,
    }),
    getConnector(OUTER_CONNECTOR_X, height, false, BUMP_BLEED),
  ].join("");
}
