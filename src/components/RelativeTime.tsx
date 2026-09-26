import {
  Calendar04Icon,
  Clock01Icon,
  CodeIcon,
  Forward02Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/Icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/Tooltip";
import { cn } from "@/shadcn/utils";
import {
  formatDetailedDuration,
  formatExactDate,
  formatRelativeDate,
} from "@/utils/date";

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
          {formatRelativeDate(target)}
          <Icon
            icon={Clock01Icon}
            className="size-3 opacity-0 transition-opacity group-hover/date:opacity-100 group-focus-visible/date:opacity-100 pointer-coarse:opacity-100"
          />
        </button>
      </TooltipTrigger>
      <TooltipContent sideOffset={6} className="flex-col items-start gap-1">
        <span className="inline-flex items-center gap-1.5">
          <Icon icon={Calendar04Icon} />
          {formatExactDate(target)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Icon icon={Forward02Icon} />
          {formatDetailedDuration(target)}
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
