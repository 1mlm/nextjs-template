"use client";

import { chartCssVars, useChartStable, useYScale } from "./chart-context";
import { resolveYAxisTickCount } from "./y-axis-ticks";

const compactNumberFormat = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

// value labels down one side of the plot, so you can tell 300 from 3,000.
// with two series on different scales give each its own axis (yAxisId on
// the Line and here) and color it like its line, left for one right for
// the other, and nobody has to guess which numbers belong to what
export function YAxis({
  yAxisId,
  side = "left",
  numTicks,
  color = chartCssVars.label,
  label,
  formatValue = compactNumberFormat.format,
}: {
  yAxisId?: string;
  side?: "left" | "right";
  numTicks?: number;
  color?: string;
  // small title above the labels, e.g. the series name
  label?: string;
  formatValue?: (value: number) => string;
}) {
  const scale = useYScale(yAxisId);
  const { innerWidth, margin } = useChartStable();
  const isLeft = side === "left";
  const x = isLeft ? -10 : innerWidth + 10;
  const textAnchor = isLeft ? "end" : "start";
  const ticks = scale.ticks(resolveYAxisTickCount(numTicks));

  return (
    <g aria-hidden className="pointer-events-none select-none">
      {/* the title hugs the outer edge of the margin, the tick labels hug
      the plot, so a long name never gets cut off by the chart's edge */}
      {label && (
        <text
          x={isLeft ? -margin.left : innerWidth + margin.right}
          textAnchor={isLeft ? "start" : "end"}
          y={-16}
          fill={color}
          fontSize={11}
          fontWeight={600}
        >
          {label}
        </text>
      )}
      {ticks.map((tick) => (
        <text
          key={tick}
          {...{ x, textAnchor }}
          y={scale(tick)}
          dy="0.32em"
          fill={color}
          fontSize={11}
          className="tabular-nums"
        >
          {formatValue(tick)}
        </text>
      ))}
    </g>
  );
}
