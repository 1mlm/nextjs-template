import { area, curveMonotoneX, line } from "d3-shape";
import { useId } from "react";
import { cn } from "@/shadcn/utils";
import { type Color, getColorSwatch } from "@/utils/color";

const WIDTH = 100;
const HEIGHT = 28;
// room for the stroke and the end dot so they never get clipped
const PADDING = 3;

type Point = [x: number, y: number];

function getPoints(values: number[]): Point[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  // a flat series would divide by zero, it just sits in the middle
  const range = max - min;
  return values.map((value, index) => [
    values.length === 1 ? WIDTH / 2 : (index / (values.length - 1)) * WIDTH,
    range === 0
      ? HEIGHT / 2
      : PADDING + (1 - (value - min) / range) * (HEIGHT - PADDING * 2),
  ]);
}

const drawLine = line().curve(curveMonotoneX);
const drawArea = area<Point>()
  .x(([x]) => x)
  .y0(HEIGHT)
  .y1(([, y]) => y)
  .curve(curveMonotoneX);

// a trend in a table cell or next to a number, no axes and no labels. green
// when it ended higher than it started, red when lower, unless you pick a color
export function Sparkline({
  values,
  color,
  className,
}: {
  values: number[];
  color?: Color;
  className?: string;
}) {
  const gradientId = useId();
  if (values.length === 0) return null;

  const first = values[0];
  const last = values[values.length - 1];
  const stroke = getColorSwatch(color ?? (last >= first ? "emerald" : "rose"));
  const points = getPoints(values);
  const [endX, endY] = points[points.length - 1];

  return (
    <span
      role="img"
      aria-label={`trend from ${first} to ${last}`}
      className={cn("relative inline-block h-7 w-24 align-middle", className)}
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="size-full overflow-visible"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.3} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={drawArea(points) ?? undefined} fill={`url(#${gradientId})`} />
        <path
          d={drawLine(points) ?? undefined}
          fill="none"
          stroke={stroke}
          strokeWidth={1.5}
          strokeLinecap="round"
          // the svg stretches to any box, the stroke shouldn't stretch with it
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {/* a dom dot, an svg circle would squash with the stretched viewBox */}
      <span
        style={{
          left: `${(endX / WIDTH) * 100}%`,
          top: `${(endY / HEIGHT) * 100}%`,
          background: stroke,
        }}
        className="absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full corner-round ring-2 ring-background"
      />
    </span>
  );
}
