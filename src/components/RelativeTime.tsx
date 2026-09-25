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
    <span
      className={cn("group/date inline-flex items-center gap-2", className)}
    >
      {formatRelativeDate(target)}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="Show exact date"
            className="opacity-0 transition-opacity group-hover/date:opacity-100 focus-visible:opacity-100"
          >
            <Icon icon={Clock01Icon} className="size-3" />
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
    </span>
  );
}
