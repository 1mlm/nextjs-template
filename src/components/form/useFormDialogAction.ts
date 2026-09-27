"use client";

import { useActionState, useState } from "react";
import { triggerHaptic } from "@/utils/haptics";
import { Chime, playChime } from "@/utils/sound";

type ActionResult = { error: string | null };
type ActionState = ActionResult & { failedCount: number };

// the open/submit/close-on-success wiring every FormDialog needs: runs the
// (server) action through useActionState, and on success closes the dialog
// with a little chime + buzz. onSuccess is for per-dialog extras
export function useFormDialogAction(
  action: (formData: FormData) => Promise<ActionResult>,
  onSuccess?: () => void,
) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (previousState: ActionState, formData: FormData) => {
      const result = await action(formData);
      if (result.error)
        return { ...result, failedCount: previousState.failedCount + 1 };
      setOpen(false);
      triggerHaptic("success");
      playChime(Chime.Success);
      onSuccess?.();
      return { ...result, failedCount: previousState.failedCount };
    },
    { error: null, failedCount: 0 },
  );

  // failedCount goes up on every failed submit, even with the same message,
  // so the dialog can shake again each time
  return {
    open,
    setOpen,
    error: state.error,
    failedCount: state.failedCount,
    formAction,
    pending,
  };
}
