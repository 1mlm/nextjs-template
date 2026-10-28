"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/Tooltip";
import { cn } from "@/shadcn/utils";

export type BarSegment = {
  id: string;
  label: string;
  value: number;
  color: string;
};

const valueFormat = new Intl.NumberFormat("en-US");

// one bar split by share: storage by file type, a budget by category, votes
// by option. give it a max and what's left stays an empty track. hover a
// segment (or its dot) and the rest fade
export function SegmentedBar({
  segments,
  max,
  showLegend = true,
  className,
}: {
  segments: BarSegment[];
  // the capacity, e.g. the disk size. defaults to the sum, so the bar is full
  max?: number;
  showLegend?: boolean;
  className?: string;
}) {
  const [activeId, setActiveId] = useState<string>();
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const capacity = Math.max(max ?? total, total);
  const dimIfOther = (id: string) =>
    activeId && activeId !== id ? "opacity-35" : "opacity-100";

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <motion.div
        role="img"
        aria-label={segments
          .map(({ label, value }) => `${label} ${valueFormat.format(value)}`)
          .join(", ")}
        // wipes in from the left instead of every segment popping at once
        initial={{ clipPath: "inset(0 100% 0 0 round 999px)" }}
        animate={{ clipPath: "inset(0 0% 0 0 round 999px)" }}
        transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
        onPointerLeave={() => setActiveId(undefined)}
        className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-foreground/10"
      >
        {segments.map(({ id, label, value, color }) => (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <div
                style={{ flexGrow: value, flexBasis: 0, background: color }}
                onPointerEnter={() => setActiveId(id)}
                className={cn(
                  "min-w-1 first:rounded-l-full last:rounded-r-full transition-opacity",
                  dimIfOther(id),
                )}
              />
            </TooltipTrigger>
            <TooltipContent>
              {label}: {valueFormat.format(value)}
            </TooltipContent>
          </Tooltip>
        ))}
        {capacity > total && (
          <div style={{ flexGrow: capacity - total, flexBasis: 0 }} />
        )}
      </motion.div>
      {showLegend && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
          {segments.map(({ id, label, value, color }) => (
            <li key={id} className={cn("transition-opacity", dimIfOther(id))}>
              <button
                type="button"
                onPointerEnter={() => setActiveId(id)}
                onPointerLeave={() => setActiveId(undefined)}
                className="flex items-center gap-1.5"
              >
                <span
                  style={{ background: color }}
                  className="size-2.5 rounded-full corner-round"
                />
                {label}
                <span className="text-muted-foreground tabular-nums">
                  {valueFormat.format(value)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
