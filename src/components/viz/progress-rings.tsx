"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/shadcn/utils";
import { type Color, getColorSwatch } from "@/utils/color";

export type ProgressRing = {
  id: string;
  label: string;
  value: number;
  max?: number;
  color: Color;
};

const SIZE = 100;
const STROKE_WIDTH = 9;
const RING_GAP = 3;

const getRingRadius = (index: number) =>
  SIZE / 2 - STROKE_WIDTH / 2 - index * (STROKE_WIDTH + RING_GAP);

// one ring is a progress circle, several are the nested activity rings: how
// far along each goal is, readable at a glance without a single word. the
// middle takes anything (an icon, one big number)
export function ProgressRings({
  rings,
  children,
  className,
}: {
  rings: ProgressRing[];
  children?: ReactNode;
  className?: string;
}) {
  const summary = rings
    .map(
      ({ label, value, max = 100 }) =>
        `${label} ${Math.round((value / max) * 100)}%`,
    )
    .join(", ");

  return (
    <div className={cn("relative size-32", className)}>
      <svg
        viewBox={`${-SIZE / 2} ${-SIZE / 2} ${SIZE} ${SIZE}`}
        role="img"
        aria-label={summary}
        className="size-full -rotate-90"
      >
        {rings.map(({ id, value, max = 100, color }, index) => {
          const radius = getRingRadius(index);
          const progress = Math.min(Math.max(value / max, 0), 1);
          return (
            <g key={id}>
              <circle
                r={radius}
                fill="none"
                strokeWidth={STROKE_WIDTH}
                className="stroke-foreground/10"
              />
              {/* round caps draw a dot at zero, so an empty ring draws nothing */}
              {progress > 0 && (
                <motion.circle
                  r={radius}
                  fill="none"
                  stroke={getColorSwatch(color)}
                  strokeWidth={STROKE_WIDTH}
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: progress }}
                  transition={{
                    type: "spring",
                    bounce: 0.2,
                    duration: 1.1,
                    delay: index * 0.12,
                  }}
                />
              )}
            </g>
          );
        })}
      </svg>
      {children && (
        <div className="absolute inset-0 grid place-items-center">
          {children}
        </div>
      )}
    </div>
  );
}
