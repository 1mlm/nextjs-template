const MS_PER_DAY = 86_400_000;

const getStartOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

// week starts monday
const getStartOfWeek = (d: Date) => {
  const x = getStartOfDay(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
};

// these compare the dates themselves, not elapsed time
// monday to wednesday is always 2 days apart no matter what the clock says
const getDayDiff = (a: Date, b: Date) =>
  Math.round(
    (getStartOfDay(a).getTime() - getStartOfDay(b).getTime()) / MS_PER_DAY,
  );
const getWeekDiff = (a: Date, b: Date) =>
  Math.round(
    (getStartOfWeek(a).getTime() - getStartOfWeek(b).getTime()) /
      (7 * MS_PER_DAY),
  );
const getMonthDiff = (a: Date, b: Date) =>
  (a.getFullYear() - b.getFullYear()) * 12 + (a.getMonth() - b.getMonth());

const dateToTimeString = (d: Date) =>
  d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

// 1st, 2nd, 3rd, 4th... 11th-13th stay "th" even though they end in 1/2/3
const getOrdinalSuffix = (day: number) => {
  if (day % 100 >= 11 && day % 100 <= 13) return "th";
  return ["th", "st", "nd", "rd"][day % 10] ?? "th";
};

// "July 4th, 2026 4:24 PM GMT+1"
export function formatExactDate(date: Date | string | number): string {
  const target = new Date(date);
  const month = target.toLocaleDateString("en", { month: "long" });
  const day = target.getDate();
  const year = target.getFullYear();
  const time = dateToTimeString(target);
  const offset = target
    .toLocaleTimeString("en", { timeZoneName: "shortOffset" })
    .split(" ")
    .pop();

  return `${month} ${day}${getOrdinalSuffix(day)}, ${year} ${time} ${offset}`;
}

// "in 2 days" for future, "2 days ago" for past
const formatRelativeLabel = (n: number, unit: string, future: boolean) => {
  const label = `${n} ${unit}${n > 1 ? "s" : ""}`;
  return future ? `In ${label}` : `${label} ago`;
};

// relative date based on calendar buckets not raw duration
// tomorrow at 4am reads "tomorrow at 4:00 AM" even if that's only 5 hours away
// today stays fine grained (just now / minutes / hours) since "today at ..." isn't relative enough
// falls through the biggest matching bucket: now, minute, hour, day, week, month, year
export function formatRelativeDate(
  date: Date | string | number,
  now: Date = new Date(),
): string {
  const target = new Date(date);
  const seconds = (target.getTime() - now.getTime()) / 1000;
  const future = seconds > 0;

  const days = getDayDiff(target, now);
  if (days === 0) {
    if (Math.abs(seconds) < 60) return "Just now";
    const minutes = Math.round(Math.abs(seconds) / 60);
    if (minutes < 60) return formatRelativeLabel(minutes, "minute", future);
    const hours = Math.round(Math.abs(seconds) / 3600);
    return formatRelativeLabel(hours, "hour", future);
  }

  const time = dateToTimeString(target);
  if (days === 1) return `Tomorrow at ${time}`;
  if (days === -1) return `Yesterday at ${time}`;
  if (Math.abs(days) < 7)
    return `${formatRelativeLabel(Math.abs(days), "day", days > 0)} at ${time}`;

  const weeks = getWeekDiff(target, now);
  if (Math.abs(weeks) < 5)
    return formatRelativeLabel(Math.abs(weeks), "week", weeks > 0);

  const months = getMonthDiff(target, now);
  if (Math.abs(months) < 12)
    return formatRelativeLabel(Math.abs(months), "month", months > 0);

  const years = target.getFullYear() - now.getFullYear();
  return formatRelativeLabel(Math.abs(years), "year", years > 0);
}

// "1h 30m", "45m", "2h" — compact, no "and"/commas needed for a two-unit max
export function formatDurationMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

const DURATION_UNITS = [
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
  ["second", 1],
] as const;

// "2 days, 3 hours and 35 seconds ago", skips units that are zero
export function formatDetailedDuration(
  date: Date | string | number,
  now: Date = new Date(),
): string {
  const target = new Date(date);
  const future = target.getTime() > now.getTime();
  const totalSeconds = Math.abs(
    Math.round((target.getTime() - now.getTime()) / 1000),
  );

  const { parts } = DURATION_UNITS.reduce(
    ({ remaining, parts }, [unit, secondsPerUnit]) => {
      const amount = Math.floor(remaining / secondsPerUnit);
      const label =
        amount > 0 ? [`${amount} ${unit}${amount > 1 ? "s" : ""}`] : [];
      return {
        remaining: remaining % secondsPerUnit,
        parts: [...parts, ...label],
      };
    },
    { remaining: totalSeconds, parts: [] as string[] },
  );

  const joined =
    parts.length > 1
      ? `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}`
      : (parts[0] ?? "less than a second");

  return future ? `in ${joined}` : `${joined} ago`;
}
