import type { CSSProperties, PropsWithChildren } from "react";
import { cn } from "@/shadcn/utils";

// which corner of the little square the solid sliver sits in
const FUSER_MASK_BY_CORNER = {
  "top-left":
    "[mask:radial-gradient(circle_at_bottom_right,transparent_1em,#000_0)]",
  "top-right":
    "[mask:radial-gradient(circle_at_bottom_left,transparent_1em,#000_0)]",
  "bottom-left":
    "[mask:radial-gradient(circle_at_top_right,transparent_1em,#000_0)]",
  "bottom-right":
    "[mask:radial-gradient(circle_at_top_left,transparent_1em,#000_0)]",
} as const;
type FuserCorner = keyof typeof FUSER_MASK_BY_CORNER;

// how the pill squares itself off against the edge it's docked to, and
// where its two bridging slivers go. a new dock spot is a new row here
const LAYOUT_BY_ALIGN = {
  "top-center": {
    pill: "flex-row pt-2 pr-8 pb-3 pl-6 rounded-full rounded-t-none",
    fusers: [
      { corner: "top-right", at: "right-full top-0" },
      { corner: "top-left", at: "left-full top-0" },
    ],
  },
  "top-left": {
    pill: "flex-row pt-2 pr-8 pb-3 pl-4 rounded-br-full!",
    fusers: [
      { corner: "top-left", at: "left-full top-0" },
      { corner: "top-left", at: "top-full left-0" },
    ],
  },
  "top-right": {
    pill: "flex-row pt-2 pr-4 pb-3 pl-6 rounded-bl-full!",
    fusers: [
      { corner: "top-right", at: "right-full top-0" },
      { corner: "top-right", at: "top-full right-0" },
    ],
  },
  right: {
    pill: "flex-col px-3 pt-6 pb-8 rounded-l-full!",
    fusers: [
      { corner: "bottom-right", at: "right-0 bottom-full" },
      { corner: "top-right", at: "right-0 top-full" },
    ],
  },
  "bottom-center": {
    pill: "flex-row px-5 pt-3 pb-2 rounded-t-full!",
    fusers: [
      { corner: "bottom-right", at: "right-full bottom-0" },
      { corner: "bottom-left", at: "left-full bottom-0" },
    ],
  },
  "bottom-right": {
    pill: "flex-row px-5 pt-3 pb-2 rounded-tl-full!",
    fusers: [
      { corner: "bottom-right", at: "right-full bottom-0" },
      { corner: "bottom-right", at: "right-0 bottom-full" },
    ],
  },
  "bottom-left": {
    pill: "flex-row pl-4 pr-5 pt-3 pb-2 rounded-tr-full!",
    fusers: [
      { corner: "bottom-left", at: "bottom-0 left-full" },
      { corner: "bottom-left", at: "bottom-full left-0" },
    ],
  },
} satisfies Record<
  string,
  { pill: string; fusers: { corner: FuserCorner; at: string }[] }
>;

export type SquircleFuserAlign = keyof typeof LAYOUT_BY_ALIGN;

// chrome rounds the fractional position and can leave a hairline gap in the
// corner that peeks the content through, a 1px nudge further in hides it
const CORNER_NUDGE_BY_ALIGN: Partial<Record<SquircleFuserAlign, string>> = {
  "top-left": "-translate-x-px -translate-y-px",
  "top-right": "translate-x-px -translate-y-px",
  "bottom-left": "-translate-x-px translate-y-px",
  "bottom-right": "translate-x-px translate-y-px",
};

// same hairline, between a sliver and the pill. `at` always names the pill
// edge it touches with a *-full class, so push 1.1px toward it. written out
// in full cuz tailwind can't see a class glued together at runtime
function getFuserOverlapClass(at: string) {
  if (at.includes("right-full")) return "translate-x-[1.1px]";
  if (at.includes("left-full")) return "-translate-x-[1.1px]";
  if (at.includes("top-full")) return "-translate-y-[1.1px]";
  if (at.includes("bottom-full")) return "translate-y-[1.1px]";
  return "";
}

// a pill docked flush against the edge or corner of a framed area, squared
// off where it touches and bridged with two concave slivers, so the frame
// looks like it melts into the pill instead of a pill sitting on top of it.
// `background` must be the frame's own color. ported from aui-map
export function SquircleFuserContainer({
  children,
  wrapperClassName,
  className,
  interactiveClassName,
  style,
  align = "top-center",
  background = "bg-background",
}: PropsWithChildren<{
  wrapperClassName?: string;
  className?: string;
  // hover/active tints, they go on the slivers too or the hover color stops
  // at the pill edge and the corners stay the old color
  interactiveClassName?: string;
  align?: SquircleFuserAlign;
  style?: CSSProperties;
  background?: string;
}>) {
  const layout = LAYOUT_BY_ALIGN[align];

  return (
    <div
      className={cn(
        // w-max not w-fit, an absolute box with left 50% only gets half its
        // parent as fit-content room and wraps for no reason
        "relative w-max",
        CORNER_NUDGE_BY_ALIGN[align],
        wrapperClassName,
      )}
      {...{ style }}
    >
      <div
        className={cn(
          "flex items-center justify-center gap-2.5",
          background,
          layout.pill,
          className,
          interactiveClassName,
        )}
      >
        {children}
      </div>
      {layout.fusers.map(({ corner, at }) => (
        <SquircleFuser
          key={`${corner}-${at}`}
          className={cn(
            "absolute",
            at,
            getFuserOverlapClass(at),
            interactiveClassName,
          )}
          {...{ corner, background }}
        />
      ))}
    </div>
  );
}

export function SquircleFuser({
  corner,
  background = "bg-background",
  className,
}: {
  corner: FuserCorner;
  background?: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "aspect-square! h-[1em]! w-auto!",
        background,
        FUSER_MASK_BY_CORNER[corner],
        className,
      )}
    />
  );
}
