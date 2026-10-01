"use client";

import NumberFlow from "@number-flow/react";
import { EmojiAnimation, FluentEmoji } from "@/components/FluentEmoji";
import { Icon } from "@/components/Icon";
import { cn } from "@/shadcn/utils";
import { APP_ICONS } from "@/utils/icons";

export type StreakDay = { date: string; label: string; isDone: boolean };

// the daily streak card: a flame that lights up once today's lesson is done,
// the count rolls when it changes, and a row of the last days (the last one
// is today, ringed while it's still waiting)
export function StreakFlame({
  streak,
  week,
  className,
}: {
  streak: number;
  week: StreakDay[];
  className?: string;
}) {
  const isTodayDone = week.at(-1)?.isDone ?? false;

  return (
    <div
      className={cn(
        "flex w-full max-w-xs flex-col gap-4 rounded-3xl border bg-card p-4",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <FluentEmoji
          emoji="fire"
          animation={EmojiAnimation.Hover}
          className={cn(
            "size-14 transition-[filter,opacity] duration-500",
            !isTodayDone && "opacity-45 grayscale",
          )}
        />
        <div className="flex flex-col">
          <NumberFlow
            value={streak}
            className="text-3xl leading-none font-bold tabular-nums"
          />
          <span className="text-sm text-muted-foreground">day streak</span>
        </div>
      </div>
      <div className="flex justify-between">
        {week.map((day, index) => {
          const isToday = index === week.length - 1;
          return (
            <div key={day.date} className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-xl transition-colors duration-300",
                  day.isDone
                    ? "bg-orange-500 text-white"
                    : "bg-muted text-muted-foreground",
                  isToday && !day.isDone && "ring-2 ring-orange-500/50",
                )}
              >
                {day.isDone && (
                  <Icon icon={APP_ICONS.confirm} strokeWidth={3} />
                )}
              </span>
              <span className="text-xs text-muted-foreground">{day.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
