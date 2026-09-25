"use client";

import { useActionState, useState } from "react";
import { triggerHaptic } from "@/utils/haptics";
import { Chime, playChime } from "@/utils/sound";

type ActionResult = { error: string | null };

// the open/submit/close-on-success wiring every FormDialog needs: runs the
// (server) action through useActionState, and on success closes the dialog
// with a little chime + buzz. onSuccess is for per-dialog extras
export function useFormDialogAction(
  action: (formData: FormData) => Promise<ActionResult>,
  onSuccess?: () => void,
) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (_previousState: ActionResult, formData: FormData) => {
      const result = await action(formData);
      if (!result.error) {
        setOpen(false);
        triggerHaptic("success");
        playChime(Chime.Success);
        onSuccess?.();
      }
      return result;
    },
    { error: null },
  );

  return { open, setOpen, error: state.error, formAction, pending };
}
