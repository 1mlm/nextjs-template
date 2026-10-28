import {
  AlertCircleIcon,
  CheckmarkCircle02Icon,
  WifiOff01Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { Icon } from "@/components/Icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/Tooltip";
import { cn } from "@/shadcn/utils";
import { SaveState } from "./useAutosave";

const SAVE_STATE_VIEW: Record<
  SaveState,
  { label: string; icon?: IconSvgElement; className: string }
> = {
  [SaveState.Saved]: {
    label: "Saved",
    icon: CheckmarkCircle02Icon,
    className: "text-green-600 dark:text-green-400",
  },
  [SaveState.Dirty]: { label: "Unsaved changes", className: "" },
  [SaveState.Saving]: {
    label: "Saving",
    className: "text-muted-foreground",
  },
  [SaveState.Offline]: {
    label: "Offline, saves when you're back",
    icon: WifiOff01Icon,
    className: "text-amber-600 dark:text-amber-400",
  },
  [SaveState.Error]: {
    label: "Couldn't save, tap to retry",
    icon: AlertCircleIcon,
    className: "text-destructive",
  },
};

// the save state as one small icon, the words live in the tooltip and a
// polite live region for screen readers. an error one is a retry button
export function SaveStatus({
  state,
  onRetry,
  className,
}: {
  state: SaveState;
  onRetry?: () => void;
  className?: string;
}) {
  const { label, icon, className: stateClassName } = SAVE_STATE_VIEW[state];
  const isRetry = state === SaveState.Error && onRetry;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          disabled={!isRetry}
          onClick={onRetry}
          aria-label={label}
          className={cn(
            "grid size-6 place-items-center rounded-full corner-round text-base outline-none enabled:cursor-pointer focus-visible:ring-2 focus-visible:ring-ring/50",
            stateClassName,
            className,
          )}
        >
          {state === SaveState.Dirty && (
            <span className="size-1.5 rounded-full corner-round bg-foreground/40" />
          )}
          {state === SaveState.Saving && (
            <Icon icon={AlertCircleIcon} isLoading />
          )}
          {icon && <Icon {...{ icon }} />}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
      <span role="status" className="sr-only">
        {label}
      </span>
    </Tooltip>
  );
}
