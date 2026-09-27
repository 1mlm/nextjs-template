"use client";

import { arc, pie } from "d3-shape";
import { motion } from "motion/react";
import { useState } from "react";
import { cn } from "@/shadcn/utils";
import { triggerHaptic } from "@/utils/haptics";

export type PieSlice = {
  id: string;
  label: string;
  value: number;
  color: string;
};

const SIZE = 200;
const OUTER_RADIUS = SIZE / 2 - 8;
const INNER_RADIUS = OUTER_RADIUS * 0.62;
// how far a hovered slice slides out from the center
const POP_DISTANCE = 7;

const percentFormat = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 0,
});
const valueFormat = new Intl.NumberFormat("en-US");

const makeSliceAngles = pie<PieSlice>()
  .value((slice) => slice.value)
  .sort(null)
  .padAngle(0.025);
const drawSlicePath = arc<{ startAngle: number; endAngle: number }>()
  .innerRadius(INNER_RADIUS)
  .outerRadius(OUTER_RADIUS)
  .cornerRadius(5);

// the point halfway along a slice, as a unit vector from the center, so a
// hovered slice can slide straight outward
function getSliceDirection(startAngle: number, endAngle: number) {
  const middleAngle = (startAngle + endAngle) / 2 - Math.PI / 2;
  return { x: Math.cos(middleAngle), y: Math.sin(middleAngle) };
}

// donut with the total in the middle. hover (or tap) a slice or its legend
// row: it slides out, the others fade, the middle shows its name, value and
// share. the legend is the readout, so no floating tooltip covers the chart
export function PieChart({
  data,
  totalLabel = "Total",
  className,
}: {
  data: PieSlice[];
  totalLabel?: string;
  className?: string;
}) {
  const [activeId, setActiveId] = useState<string>();
  const total = data.reduce((sum, slice) => sum + slice.value, 0);
  const slices = makeSliceAngles(data);
  const activeSlice = data.find((slice) => slice.id === activeId);

  const activate = (id: string | undefined) => {
    if (id && id !== activeId) triggerHaptic("selection");
    setActiveId(id);
  };

  return (
    <div
      className={cn(
        // sized by its own box, not the screen: a narrow card on a wide
        // screen still stacks the legend under the donut
        "@container",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-4 @sm:flex-row @sm:gap-6">
      <div className="relative aspect-square w-full max-w-52 shrink-0">
        <motion.svg
          viewBox={`${-SIZE / 2} ${-SIZE / 2} ${SIZE} ${SIZE}`}
          className="size-full overflow-visible"
          initial={{ rotate: -40, scale: 0.8, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.3, duration: 0.8 }}
          onPointerLeave={() => activate(undefined)}
        >
          {slices.map(({ data: slice, startAngle, endAngle }) => {
            const direction = getSliceDirection(startAngle, endAngle);
            const isActive = slice.id === activeId;
            return (
              <motion.path
                key={slice.id}
                d={drawSlicePath({ startAngle, endAngle }) ?? undefined}
                fill={slice.color}
                animate={{
                  x: isActive ? direction.x * POP_DISTANCE : 0,
                  y: isActive ? direction.y * POP_DISTANCE : 0,
                  opacity: activeId && !isActive ? 0.35 : 1,
                }}
                transition={{ type: "spring", bounce: 0.35, duration: 0.4 }}
                onPointerEnter={() => activate(slice.id)}
                className="cursor-pointer outline-none"
              />
            );
          })}
        </motion.svg>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <span className="flex flex-col items-center leading-tight">
            <span className="text-xs text-muted-foreground">
              {activeSlice?.label ?? totalLabel}
            </span>
            <span className="text-2xl font-bold tabular-nums">
              {valueFormat.format(activeSlice?.value ?? total)}
            </span>
            {activeSlice && (
              <span className="text-xs font-medium text-muted-foreground tabular-nums">
                {percentFormat.format(activeSlice.value / total)}
              </span>
            )}
          </span>
        </div>
      </div>

      <ul className="flex w-full flex-col gap-1">
        {data.map((slice) => (
          <li key={slice.id}>
            <button
              type="button"
              onPointerEnter={() => activate(slice.id)}
              onPointerLeave={() => activate(undefined)}
              onFocus={() => activate(slice.id)}
              onBlur={() => activate(undefined)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2 py-1 text-sm transition-colors",
                slice.id === activeId ? "bg-muted" : "hover:bg-muted",
              )}
            >
              <span
                style={{ background: slice.color }}
                className="size-3 shrink-0 rounded-sm"
              />
              <span className="flex-1 truncate text-left">{slice.label}</span>
              <span className="text-muted-foreground tabular-nums">
                {percentFormat.format(slice.value / total)}
              </span>
            </button>
          </li>
        ))}
      </ul>
      </div>
    </div>
  );
}
