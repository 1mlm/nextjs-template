import type { CSSProperties } from "react";
import colors from "tailwindcss/colors";

type Palette = typeof colors;

// tailwind's palette mixes keywords (inherit/current/transparent) and flat
// black/white in with the real ramps — only a ramp has numeric steps
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
