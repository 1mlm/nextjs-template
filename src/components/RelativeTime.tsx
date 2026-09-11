import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn/ui/tooltip";
import { cn } from "@/shadcn/utils";
import { formatExactDate, formatRelativeDate } from "@/utils/date";

// shows the relative date/time, hovering reveals the exact one — one place
// for that pairing instead of every caller re-wiring its own Tooltip +
// formatRelativeDate/formatExactDate. CustomTable's DateCell is the richer
// table-cell version of this same pairing (also shows elapsed duration and
// the raw timestamp) - reach for this one outside a table, e.g. a comment
// or activity feed
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
