"use client";

import type { IconSvgElement } from "@hugeicons/react";
import { type ComponentProps, type ReactNode, startTransition } from "react";
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
  submitIcon: IconSvgElement;
  submitLabel: ReactNode;
  submitVariant?: ComponentProps<typeof Button>["variant"];
  children: ReactNode;
}) {
  return (
    <Dialog {...{ open, onOpenChange }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      {/* capped to the viewport with the fields scrolling on their own, or a long form pushes the submit button off screen */}
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-md">
        <DialogHeader>
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
          className="flex min-h-0 min-w-0 flex-col gap-4 overflow-y-auto"
        >
          {children}
          <FormError>{error}</FormError>
          <DialogFooter>
            <SubmitButton
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
