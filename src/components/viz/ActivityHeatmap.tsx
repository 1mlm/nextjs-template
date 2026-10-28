"use client";

import {
  addDays,
  differenceInCalendarDays,
  format,
  startOfDay,
  startOfWeek,
  subWeeks,
} from "date-fns";
import { type PointerEvent, useEffect, useRef, useState } from "react";
import { cn } from "@/shadcn/utils";
import { type Color, getColorSwatch } from "@/utils/color";

export type ActivityDay = { date: Date | string; value: number };

// how much of the color each level gets, 0 is the empty cell
const LEVEL_STRENGTH = [0, 25, 45, 70, 100];
const CELL_GAP_PX = 3;
const DAYS_PER_WEEK = 7;

const getDayKey = (date: Date) => format(date, "yyyy-MM-dd");

// the level by quartile of the days that had anything, so one huge day
// doesn't wash out every ordinary one
function getLevelGetter(values: number[]) {
  const sorted = values.filter((value) => value > 0).sort((a, b) => a - b);
  const thresholds = [0.25, 0.5, 0.75].map(
    (share) => sorted[Math.floor(share * (sorted.length - 1))] ?? 0,
  );
  return (value: number) =>
    value <= 0
      ? 0
      : 1 + thresholds.filter((threshold) => value > threshold).length;
}

// the contribution calendar: a column per week, a row per weekday, darker
// the busier the day. scrolls sideways on narrow screens, starting at today.
// one shared tooltip instead of 180 radix ones, hover or tap a day
export function ActivityHeatmap({
  data,
  until,
  weeks = 26,
  color = "emerald",
  className,
}: {
  data: ActivityDay[];
  // the last day shown, passed in so server and browser agree on what "today" is
  until: Date;
  weeks?: number;
  color?: Color;
  className?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number>();
  const swatch = getColorSwatch(color);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
  }, []);

  const valueByDay = new Map(
    data.map(({ date, value }) => [getDayKey(new Date(date)), value]),
  );
  const firstDay = startOfWeek(subWeeks(startOfDay(until), weeks - 1));
  const dayCount = differenceInCalendarDays(until, firstDay) + 1;
  const days = Array.from({ length: dayCount }, (_, index) => {
    const date = addDays(firstDay, index);
    return { date, value: valueByDay.get(getDayKey(date)) ?? 0 };
  });
  const getLevel = getLevelGetter(days.map(({ value }) => value));
  const total = days.reduce((sum, { value }) => sum + value, 0);
  const activeDay = activeIndex === undefined ? undefined : days[activeIndex];

  const pickDay = (event: PointerEvent) => {
    const cell = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-index]",
    );
    setActiveIndex(cell ? Number(cell.dataset.index) : undefined);
  };

  const getCellStyle = (level: number) => ({
    background:
      level === 0
        ? undefined
        : `color-mix(in oklab, ${swatch} ${LEVEL_STRENGTH[level]}%, transparent)`,
  });
  const cellClassName = "size-(--cell) rounded-[3px] bg-foreground/8";

  return (
    <div
      style={{ "--cell": "0.75rem" } as React.CSSProperties}
      className={cn("flex flex-col gap-2", className)}
    >
      <div ref={scrollRef} className="overflow-x-auto pt-8 pb-1">
        <div
          role="img"
          aria-label={`${total} in the last ${weeks} weeks`}
          onPointerMove={pickDay}
          onPointerDown={pickDay}
          onPointerLeave={() => setActiveIndex(undefined)}
          style={{ gap: CELL_GAP_PX }}
          className="relative grid w-max grid-flow-col grid-rows-7 touch-manipulation select-none"
        >
          {days.map(({ date, value }, index) => (
            <div
              key={date.getTime()}
              data-index={index}
              style={getCellStyle(getLevel(value))}
              className={cn(
                cellClassName,
                index === activeIndex && "ring-2 ring-foreground/60",
              )}
            />
          ))}
          {activeDay && activeIndex !== undefined && (
            <span
              style={{
                left: `calc(${Math.floor(activeIndex / DAYS_PER_WEEK)} * (var(--cell) + ${CELL_GAP_PX}px) + var(--cell) / 2)`,
                top: `calc(${activeIndex % DAYS_PER_WEEK} * (var(--cell) + ${CELL_GAP_PX}px) - 0.5rem)`,
              }}
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md bg-foreground px-2 py-1 text-xs whitespace-nowrap text-background tabular-nums"
            >
              {activeDay.value} · {format(activeDay.date, "MMM d")}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center justify-end gap-1.5">
        {LEVEL_STRENGTH.map((strength, level) => (
          <span
            key={strength}
            style={getCellStyle(level)}
            className={cellClassName}
          />
        ))}
      </div>
    </div>
  );
}
