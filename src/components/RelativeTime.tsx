import { CodeIcon, Forward02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/Icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/Tooltip";
import { cn } from "@/shadcn/utils";
import {
  formatDetailedDuration,
  formatExactDate,
  formatRelativeDate,
} from "@/utils/date";
import { APP_ICONS } from "@/utils/icons";
import { useNow, useNowSelector } from "@/utils/useNow";

// the tooltip is only mounted while it's open, so the ticking clock (seconds
// in the duration) only runs for that one instead of every date on the page
function RelativeTimeDetails({ target }: { target: Date }) {
  const nowMs = useNow();
  if (nowMs === null) return null;
  const now = new Date(nowMs);

  return (
    <>
      <span className="inline-flex items-center gap-1.5">
        <Icon icon={APP_ICONS.calendar} />
        {formatExactDate(target)}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Icon icon={Forward02Icon} />
        {formatDetailedDuration(target, now)}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Icon icon={CodeIcon} />
        <span className="font-semibold">Timestamp: </span>
        {target.getTime()}
      </span>
    </>
  );
}

// relative date, a clock shows up on hover with the exact date, the elapsed
// duration and the raw timestamp. same thing inside and outside tables
export function RelativeTime({
  date,
  className,
}: {
  date: string | Date;
  className?: string;
}) {
  const target = new Date(date);
  const label = useNowSelector((now) =>
    formatRelativeDate(target, new Date(now)),
  );
  if (label === null) return null;

  return (
    <Tooltip>
      {/* the whole thing is the trigger so it's a real tap target on phones.
      no hover there, so the clock just always shows */}
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "group/date inline-flex items-center gap-2 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            className,
          )}
        >
          {label}
          <Icon
            icon={APP_ICONS.time}
            className="size-3 opacity-0 transition-opacity group-hover/date:opacity-100 group-focus-visible/date:opacity-100 pointer-coarse:opacity-100"
          />
        </button>
      </TooltipTrigger>
      <TooltipContent sideOffset={6} className="flex-col items-start gap-1">
        <RelativeTimeDetails {...{ target }} />
      </TooltipContent>
    </Tooltip>
  );
}
