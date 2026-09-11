import { toast } from "sonner";

const UNDO_WINDOW_MS = 5000;

// defers the real mutation behind a toast's undo window instead of running
// it immediately — if the tab closes before the window elapses, the
// mutation simply never fires. that's the safe failure direction: a row
// silently stays undeleted rather than being silently lost.
//
// this is the one place toasts belong in this app (see CLAUDE.md) — the row
// itself just vanished from the table, so there's no inline element left to
// show feedback next to, and undo needs a few seconds to be worth having
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
  let undone = false;

  const timer = setTimeout(async () => {
    if (undone) return;
    const result = await commit();
    if (result?.error) {
      onRevert();
      toast.error(result.error);
    }
  }, UNDO_WINDOW_MS);

  toast.success(message, {
    duration: UNDO_WINDOW_MS,
    action: {
      label: undoLabel,
      onClick: () => {
        undone = true;
        clearTimeout(timer);
        onRevert();
      },
    },
  });
}
