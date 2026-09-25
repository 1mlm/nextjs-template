import { toast } from "sonner";

const UNDO_WINDOW_MS = 5000;

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
      toast.error(result.error);
    }
  }, UNDO_WINDOW_MS);

  const toastId = toast.success(message, {
    duration: UNDO_WINDOW_MS,
    action: {
      label: undoLabel,
      onClick: () => {
        clearTimeout(timer);
        onRevert();
      },
    },
  });
}
