"use client";

import { Cancel01Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { MiniButton, MiniButtonTone } from "@/components/MiniButton";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { cn } from "@/shadcn/utils";

// inline arm-then-confirm for destructive-ish stuff: click swaps in a
// cancel/confirm pair and confirm stays locked for `holdSeconds`. `confirmText`
// also makes you type that exact text first, for the really scary ones (deleting
// an account). inline on purpose, no toast or window.confirm, the friction sits
// right where you clicked
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
  onConfirm: () => Promise<void>;
}) {
  const [armed, setArmed] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(holdSeconds);
  const [pending, setPending] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!armed) return;
    setSecondsLeft(holdSeconds);
    setTypedText("");
    setError(null);
    const interval = setInterval(
      () => setSecondsLeft((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => clearInterval(interval);
  }, [armed, holdSeconds]);

  const isHolding = secondsLeft > 0;
  const textMismatch = confirmText !== undefined && typedText !== confirmText;
  const locked = isHolding || textMismatch || disabled;

  async function handleConfirm() {
    setPending(true);
    setError(null);
    try {
      await onConfirm();
      setArmed(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong, try again",
      );
    } finally {
      setPending(false);
    }
  }

  if (!armed)
    return (
      <MiniButton
        {...{ icon, label, tone, className }}
        onClick={() => setArmed(true)}
      />
    );

  return (
    <div className="flex flex-col gap-1.5">
      {confirmText !== undefined && (
        <Input
          value={typedText}
          onChange={(e) => setTypedText(e.target.value)}
          onPaste={(e) => e.preventDefault()}
          placeholder={confirmTextPlaceholder ?? confirmText}
          autoFocus
          className="h-8"
        />
      )}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={pending}
          onClick={() => setArmed(false)}
        >
          <Icon icon={Cancel01Icon} />
          <span className="sr-only">Cancel</span>
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={locked || pending}
          onClick={handleConfirm}
          className={cn("text-xs", className)}
        >
          <Icon
            icon={pending ? Loading03Icon : icon}
            className={pending ? "animate-spin" : undefined}
          />
          {isHolding ? `Wait... ${secondsLeft}` : confirmLabel}
        </Button>
      </div>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
