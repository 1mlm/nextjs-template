import type { IconSvgElement } from "@hugeicons/react";
import { toast } from "sonner";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
import { cn } from "@/shadcn/utils";
import { triggerHaptic } from "@/utils/haptics";
import { APP_ICONS } from "@/utils/icons";

const UNDO_WINDOW_MS = 5000;

// sonner's own toast is a flat little box that doesn't look like the rest of
// the app, so ours are custom: a squircle card, a tinted icon chip, a big
// enough undo button and a bar draining for the time left
function AppToast({
  icon,
  message,
  isError,
  durationMs,
  action,
}: {
  icon: IconSvgElement;
  message: string;
  isError?: boolean;
  durationMs: number;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="relative flex w-[min(22rem,calc(100vw-2rem))] items-center gap-3 overflow-hidden rounded-2xl border bg-popover p-2.5 pl-3 text-popover-foreground shadow-xl shadow-black/15">
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-xl",
          isError
            ? "bg-destructive/15 text-destructive"
            : "bg-foreground/8 text-foreground",
        )}
      >
        <Icon {...{ icon }} className="size-4.5" />
      </span>
      <span className="min-w-0 flex-1 text-sm font-medium">{message}</span>
      {action && (
        <Button
          variant="secondary"
          onClick={action.onClick}
          className="h-9 rounded-xl px-3"
        >
          <Icon icon={APP_ICONS.undo} />
          {action.label}
        </Button>
      )}
      <span
        style={{ animationDuration: `${durationMs}ms` }}
        className="absolute inset-x-0 bottom-0 h-0.5 origin-left animate-[toast-drain_linear_forwards] bg-foreground/25"
      />
    </div>
  );
}

const ERROR_TOAST_MS = 6000;

const showErrorToast = (message: string) =>
  toast.custom(
    () => (
      <AppToast
        icon={APP_ICONS.warning}
        isError
        durationMs={ERROR_TOAST_MS}
        {...{ message }}
      />
    ),
    { duration: ERROR_TOAST_MS },
  );

// the real mutation waits behind the toast's undo window instead of running
// right away. if the tab closes before that, it just never fires, which is the
// safe way to fail (a row silently stays undeleted, never silently lost).
// this is the one place toasts belong in the app (see the Toaster note in
// layout.tsx): the row itself just vanished so there's nothing inline left to
// show feedback next to, and undo needs a few seconds to be useful
export function runUndoableAction({
  commit,
  onRevert,
  message,
  undoLabel = "Undo",
}: {
  commit: () => Promise<{ error: string | null } | undefined>;
  onRevert: () => void;
  message: string;
  undoLabel?: string;
}) {
  // sonner pauses its own timer on hover but this one keeps going, so kill
  // the toast first or undo stays clickable after the commit already ran
  const timer = setTimeout(async () => {
    toast.dismiss(toastId);
    const result = await commit().catch((error: unknown) => ({
      error: error instanceof Error ? error.message : "Something went wrong",
    }));
    if (result?.error) {
      onRevert();
      triggerHaptic("error");
      showErrorToast(result.error);
    }
  }, UNDO_WINDOW_MS);

  const undo = () => {
    clearTimeout(timer);
    toast.dismiss(toastId);
    onRevert();
  };

  const toastId = toast.custom(
    () => (
      <AppToast
        icon={APP_ICONS.remove}
        durationMs={UNDO_WINDOW_MS}
        action={{ label: undoLabel, onClick: undo }}
        {...{ message }}
      />
    ),
    { duration: UNDO_WINDOW_MS },
  );
}
