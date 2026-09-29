import type { CSSProperties } from "react";
import { cn } from "@/shadcn/utils";

// a rounded-square progress ring drawn as two strokes on a 100 by 100 grid,
// the track underneath and the filled part on top (progress goes 0 to 1).
// it inherits the size of whatever it's placed in
export function SquircleRing({
  progress,
  inset = 4,
  radius = 32,
  strokeWidth = 7,
  progressStroke = "var(--foreground)",
  className,
  style,
}: {
  progress: number;
  inset?: number;
  radius?: number;
  strokeWidth?: number;
  progressStroke?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const shape = {
    x: inset,
    y: inset,
    width: 100 - inset * 2,
    height: 100 - inset * 2,
    rx: radius,
    fill: "none",
    strokeWidth,
  };

  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden
      className={cn("size-full", className)}
      {...{ style }}
    >
      <rect {...shape} className="stroke-border" />
      <rect
        {...shape}
        stroke={progressStroke}
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray={`${progress * 100} 100`}
        className="transition-[stroke-dasharray] duration-500 ease-linear"
      />
    </svg>
  );
}
