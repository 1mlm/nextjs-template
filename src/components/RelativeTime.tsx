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
import { useNow } from "@/utils/useNow";

// relative date, a clock shows up on hover with the exact date, the elapsed
// duration and the raw timestamp. same thing inside and outside tables
export function RelativeTime({
  date,
  className,
}: {
  date: string | Date;
  className?: string;
}) {
  const nowMs = useNow();
  if (nowMs === null) return null;

  const now = new Date(nowMs);
  const target = new Date(date);

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
          {formatRelativeDate(target, now)}
          <Icon
            icon={APP_ICONS.time}
            className="size-3 opacity-0 transition-opacity group-hover/date:opacity-100 group-focus-visible/date:opacity-100 pointer-coarse:opacity-100"
          />
        </button>
      </TooltipTrigger>
      <TooltipContent sideOffset={6} className="flex-col items-start gap-1">
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
      </TooltipContent>
    </Tooltip>
  );
}
