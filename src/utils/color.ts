import type { CSSProperties } from "react";
import colors from "tailwindcss/colors";

type Palette = typeof colors;

// tailwind's palette mixes keywords (inherit/current/transparent) and flat
// black/white in with the real ramps, only a ramp has numeric steps
export type Color = {
  [K in keyof Palette]: Palette[K] extends { 500: string } ? K : never;
}[keyof Palette];

const isColorRamp = (value: Palette[keyof Palette]): value is Palette["blue"] =>
  typeof value === "object" && "500" in value;

// a color often arrives as a plain string (a user-editable value, an api field),
// so anything reading the palette needs a fallback
export function isColor(value: string): value is Color {
  return value in colors && isColorRamp(colors[value as keyof Palette]);
}

// every hue tailwind ships, for pickers and swatch grids
export const COLORS = Object.keys(colors).filter(isColor);

const toColorRamp = (colorId?: string | null) =>
  colors[colorId && isColor(colorId) ? colorId : "gray"];

// tinted background + readable text, straight off tailwind's palette. light-dark()
// rather than a `dark:` variant because the theme switches on color-scheme, not a class
export function getColorStyle(colorId?: string | null): CSSProperties {
  const ramp = toColorRamp(colorId);
  return {
    backgroundColor: `color-mix(in oklab, ${ramp[500]} 15%, transparent)`,
    color: `light-dark(${ramp[700]}, ${ramp[400]})`,
  };
}

// every gray-ish family tailwind ships (4.2 snuck in mauve/olive/mist/taupe
// too, sneakyyy). hashing a tag into "slate" vs "zinc" isn't a visually
// distinct color, it's just noise next to the real hues
const NEUTRAL_COLORS: Color[] = [
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "mauve",
  "olive",
  "mist",
  "taupe",
];

export const TAG_COLORS = COLORS.filter(
  (color) => !NEUTRAL_COLORS.includes(color),
);

// deterministic string -> color, so a tag/status/user pulled straight from
// the db gets a consistent, distinct color without hand-maintaining a
// {value: color} map that someone forgets to update for the next enum value.
// not cryptographic, just needs to spread evenly across TAG_COLORS
function hashString(value: string): number {
  const hash = [...value].reduce(
    (acc, char) => (acc * 31 + char.charCodeAt(0)) | 0,
    0,
  );
  return Math.abs(hash);
}

export function getColorForKey(key: string): Color {
  return TAG_COLORS[hashString(key) % TAG_COLORS.length];
}

// oklch math for recoloring an svg's hex colors. oklch keeps "how light" and
// "how colorful" apart from "which hue", so swapping only the hue keeps every
// shade and highlight where it was
type Oklch = { lightness: number; chroma: number; hue: number };

const srgbToLinear = (channel: number) =>
  channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
const linearToSrgb = (channel: number) =>
  channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055;

function hexToOklch(hex: string): Oklch {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((start) =>
    srgbToLinear(Number.parseInt(hex.slice(start, start + 2), 16) / 255),
  );
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bAxis = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return {
    lightness,
    chroma: Math.hypot(a, bAxis),
    hue: ((Math.atan2(bAxis, a) * 180) / Math.PI + 360) % 360,
  };
}

function oklchToLinearRgb({ lightness, chroma, hue }: Oklch) {
  const a = chroma * Math.cos((hue * Math.PI) / 180);
  const b = chroma * Math.sin((hue * Math.PI) / 180);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const isInSrgbGamut = (rgb: number[]) =>
  rgb.every((channel) => channel >= -0.0001 && channel <= 1.0001);

// a hue swap can land outside what a screen shows (a vivid pink turned
// green), so the chroma gets pulled in until it fits
function oklchToHex(color: Oklch) {
  const fittingChroma = Array.from({ length: 20 }, (_, step) => step).reduce(
    (chroma) =>
      isInSrgbGamut(oklchToLinearRgb({ ...color, chroma }))
        ? chroma
        : chroma * 0.9,
    color.chroma,
  );
  return `#${oklchToLinearRgb({ ...color, chroma: fittingChroma })
    .map((channel) =>
      Math.round(Math.min(Math.max(linearToSrgb(channel), 0), 1) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

// "oklch(72.3% 0.219 149.579)" -> { lightness: 0.723, chroma: 0.219, hue: 149.579 }
function parseOklch(value: string): Oklch {
  const [lightness = "0", chroma = "0", hue = "0"] =
    /oklch\(([\d.]+)% ([\d.]+) ([\d.]+)/.exec(value)?.slice(1) ?? [];
  return {
    lightness: Number(lightness) / 100,
    chroma: Number(chroma),
    hue: Number(hue),
  };
}

// a tailwind ramp (50 -> 950) sorted light to dark as oklch
const getRamp = (color: Color) => Object.values(colors[color]).map(parseOklch);

// the ramp's own chroma and hue at a given lightness, blended between the two
// steps around it, so a recolored shade is one tailwind could have shipped
function sampleRamp(ramp: Oklch[], lightness: number) {
  const darkerIndex = ramp.findIndex((step) => step.lightness <= lightness);
  const darker = ramp[darkerIndex === -1 ? ramp.length - 1 : darkerIndex];
  const lighter = ramp[Math.max(darkerIndex - 1, 0)] ?? darker;
  if (!darker || !lighter) return { chroma: 0, hue: 0 };
  const span = lighter.lightness - darker.lightness;
  const progress = span > 0 ? (lightness - darker.lightness) / span : 0;
  const blend = (from: number, to: number) =>
    from + (to - from) * Math.min(Math.max(progress, 0), 1);
  return {
    chroma: blend(darker.chroma, lighter.chroma),
    hue: blend(darker.hue, lighter.hue),
  };
}

// below this it's a grey, a white or a near black (paper, metal, eyes,
// outlines, shines): those stay exactly as drawn
const THEMED_MIN_CHROMA = 0.05;

const HEX_PATTERN = /#[0-9a-f]{6}\b/gi;

function recolorHex(hex: string, ramp: Oklch[]) {
  const original = hexToOklch(hex);
  if (original.chroma < THEMED_MIN_CHROMA) return hex;
  const { chroma, hue } = sampleRamp(ramp, original.lightness);
  const softness = Math.min(Math.max(original.chroma / 0.14, 0.55), 1);
  return oklchToHex({
    lightness: original.lightness,
    chroma: chroma * softness,
    hue,
  });
}

// fluent's inner shadows and glows are filters that paint one flat color,
// written as a color matrix "0 0 0 0 r  0 0 0 0 g  0 0 0 0 b  0 0 0 a 0".
// those hold the yellow highlights, a hex-only swap left them showing
const FLAT_COLOR_MATRIX_PATTERN =
  /values="0 0 0 0 ([\d.]+) 0 0 0 0 ([\d.]+) 0 0 0 0 ([\d.]+) 0 0 0 ([\d.]+) 0"/g;

const channelToHexPair = (channel: string) =>
  Math.round(Number(channel) * 255)
    .toString(16)
    .padStart(2, "0");

const hexPairToChannel = (hex: string, start: number) =>
  (Number.parseInt(hex.slice(start, start + 2), 16) / 255).toFixed(6);

function recolorColorMatrix(ramp: Oklch[]) {
  return (_match: string, r: string, g: string, b: string, alpha: string) => {
    const hex = recolorHex(
      `#${[r, g, b].map(channelToHexPair).join("")}`,
      ramp,
    );
    const [red, green, blue] = [1, 3, 5].map((start) =>
      hexPairToChannel(hex, start),
    );
    return `values="0 0 0 0 ${red} 0 0 0 0 ${green} 0 0 0 0 ${blue} 0 0 0 ${alpha} 0"`;
  };
}

// the recolor the aui-map compass and calendar got by hand: every colorful
// shade (the "brand" parts) moves onto the tailwind ramp at the same
// lightness, the neutrals are untouched, so it looks drawn in that color
// from the start. a softer original stays softer (chroma scales with it)
export function recolorSvg(svg: string, color: Color) {
  const ramp = getRamp(color);
  return svg
    .replace(HEX_PATTERN, (hex) => recolorHex(hex, ramp))
    .replace(FLAT_COLOR_MATRIX_PATTERN, recolorColorMatrix(ramp));
}

// the 500 shade as a css color, for swatches of a color picked at runtime
// (a var(--color-x-500) only exists if tailwind saw that class somewhere)
export const getColorSwatch = (color: Color) => colors[color][500];
