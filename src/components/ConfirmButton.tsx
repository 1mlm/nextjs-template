"use client";

import type { IconSvgElement } from "@hugeicons/react";
import { type ReactNode, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { MiniButton, MiniButtonTone } from "@/components/MiniButton";
import { ResponsivePopover } from "@/components/ResponsivePopover";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { triggerHaptic } from "@/utils/haptics";

// arm-then-confirm for destructive-ish stuff: the button opens a small popover
// (bottom sheet on phones) where confirm stays locked for `holdSeconds`.
// `confirmText` also makes you type that exact text first, for the really
// scary ones (deleting an account), and every keystroke restarts the wait so
// you can't type and mash confirm. a popover so nothing around the button
// shifts, no toast or window.confirm, the friction sits right where you clicked
export function ConfirmButton({
  icon,
  label,
  confirmLabel,
  holdSeconds = 5,
  tone = MiniButtonTone.Neutral,
  className,
  confirmText,
  confirmTextPlaceholder,
  disabled,
  trigger,
  onConfirm,
}: {
  icon: IconSvgElement;
  label: string;
  confirmLabel: string;
  holdSeconds?: number;
  tone?: MiniButtonTone;
  className?: string;
  confirmText?: string;
  confirmTextPlaceholder?: string;
  // outside reason to keep confirm locked (a required field left blank etc)
  disabled?: boolean;
  // swaps the icon-only MiniButton for your own button, e.g. a labeled one
  trigger?: ReactNode;
  onConfirm: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(holdSeconds);
  const [pending, setPending] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSecondsLeft(holdSeconds);
    setTypedText("");
    setError(null);
    const interval = setInterval(
      () => setSecondsLeft((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => clearInterval(interval);
  }, [open, holdSeconds]);

  const isHolding = secondsLeft > 0;
  const textMismatch = confirmText !== undefined && typedText !== confirmText;
  const locked = isHolding || textMismatch || disabled;

  async function handleConfirm() {
    if (locked || pending) return;
    setPending(true);
    setError(null);
    try {
      await onConfirm();
      triggerHaptic("success");
      setOpen(false);
    } catch (err) {
      triggerHaptic("error");
      setError(
        err instanceof Error ? err.message : "Something went wrong, try again",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <ResponsivePopover
      {...{ open }}
      // stays open while the confirm is in flight so the result isn't lost
      onOpenChange={(next) => !pending && setOpen(next)}
      title={label}
      {...{ icon }}
      trigger={trigger ?? <MiniButton {...{ icon, label, tone, className }} />}
      className="max-md:px-4 max-md:pb-6 md:w-auto"
    >
      {/* a form so the phone keyboard's enter/go key confirms too */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleConfirm();
        }}
        className="flex flex-col gap-2"
      >
        {confirmText !== undefined && (
          <Input
            value={typedText}
            onChange={(e) => {
              setTypedText(e.target.value);
              setSecondsLeft(holdSeconds);
            }}
            onPaste={(e) => e.preventDefault()}
            placeholder={confirmTextPlaceholder ?? `type "${confirmText}"`}
            enterKeyHint="done"
            autoFocus
          />
        )}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="destructive"
            size="sm"
            disabled={locked || pending}
            className="tabular-nums"
          >
            <Icon {...{ icon }} isLoading={pending} />
            {isHolding ? `Wait... ${secondsLeft}` : confirmLabel}
          </Button>
        </div>
        {error && <span className="text-xs text-destructive">{error}</span>}
      </form>
    </ResponsivePopover>
  );
}
