"use client";

import type { IconSvgElement } from "@hugeicons/react";
import {
  type ComponentProps,
  type ReactNode,
  startTransition,
  useEffect,
  useRef,
} from "react";
import { IconChip } from "@/components/IconChip";
import type { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shadcn/ui/dialog";
import { shakeElement } from "@/utils/shake";
import { FormError } from "./FormError";
import { SubmitButton } from "./SubmitButton";

// the dialog + form + error + submit shell every add/edit dialog repeats,
// callers only bring the trigger, title, submit label and the fields.
// pairs with useFormDialogAction for open/pending/error
export function FormDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  formAction,
  pending,
  error,
  failedCount = 0,
  submitIcon,
  submitLabel,
  submitVariant,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  title: ReactNode;
  description: string;
  formAction: (formData: FormData) => void;
  pending: boolean;
  error: string | null;
  // from useFormDialogAction, every bump shakes the submit button + error
  failedCount?: number;
  submitIcon: IconSvgElement;
  submitLabel: ReactNode;
  submitVariant?: ComponentProps<typeof Button>["variant"];
  children: ReactNode;
}) {
  const submitRef = useRef<HTMLButtonElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (failedCount === 0) return;
    shakeElement(submitRef.current);
    shakeElement(errorRef.current);
  }, [failedCount]);

  return (
    <Dialog {...{ open, onOpenChange }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      {/* capped to the viewport with the fields scrolling on their own, or a long form pushes the submit button off screen */}
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-md">
        <DialogHeader className="flex-row items-center gap-2.5">
          <IconChip icon={submitIcon} />
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">
            {description}
          </DialogDescription>
        </DialogHeader>
        {/* onSubmit + startTransition on purpose, not action={formAction}. react
        wipes every field after a form action settles (even when it errored!!)
        so a failed submit would eat whatever you typed. this way nothing
        resets and on success the dialog closes anyway */}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            startTransition(() => formAction(formData));
          }}
          // a required field left empty: the browser blocks the submit and
          // fires invalid on each bad field, they and the button shake no
          onInvalidCapture={(event) => {
            shakeElement(event.target instanceof Element ? event.target : null);
            shakeElement(submitRef.current);
          }}
          className="flex min-h-0 min-w-0 flex-col gap-4"
        >
          {/* -m-1 p-1 so focus rings aren't clipped by the scroll box */}
          <div className="-m-1 flex min-h-0 flex-col gap-4 overflow-y-auto p-1">
            {children}
            <div ref={errorRef} className="empty:hidden">
              <FormError>{error}</FormError>
            </div>
          </div>
          <DialogFooter>
            <SubmitButton
              ref={submitRef}
              icon={submitIcon}
              variant={submitVariant}
              {...{ pending }}
            >
              {submitLabel}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
