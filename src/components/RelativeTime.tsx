import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/Tooltip";
import { cn } from "@/shadcn/utils";
import { formatExactDate, formatRelativeDate } from "@/utils/date";

// relative date, hover shows the exact one. CustomTable's DateCell is the
// beefier table version (elapsed duration + raw timestamp too), this one is for
// outside tables, like a comment or an activity feed
export function RelativeTime({
  date,
  className,
}: {
  date: string | Date;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "cursor-default underline decoration-dotted underline-offset-2",
            className,
          )}
        >
          {formatRelativeDate(date)}
        </span>
      </TooltipTrigger>
      <TooltipContent sideOffset={6}>{formatExactDate(date)}</TooltipContent>
    </Tooltip>
  );
}
