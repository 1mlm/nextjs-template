"use client";

import { Cancel01Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { useEffect, useState } from "react";
import { type HugeIcon, Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn/ui/tooltip";
import { cn } from "@/shadcn/utils";

// small inline arm-then-confirm flow for a destructive-ish action: click
// swaps the trigger for a cancel/confirm pair, the confirm side stays
// disabled and counts down for `holdSeconds` first. Passing `confirmText`
// additionally requires typing that exact text before it unlocks, for
// actions serious enough that a hold-timer alone isn't enough friction
// (e.g. deleting an account) — inline, not a toast/window.confirm, so the
// friction sits right where the click happened
export function ConfirmButton({
  icon,
  label,
  confirmLabel,
  holdSeconds = 5,
  variant = "ghost",
  className,
  confirmText,
  confirmTextPlaceholder,
  disabled,
  onConfirm,
}: {
  icon: HugeIcon;
  label: string;
  confirmLabel: string;
  holdSeconds?: number;
  variant?: "ghost" | "destructive" | "outline";
  className?: string;
  confirmText?: string;
  confirmTextPlaceholder?: string;
  // external condition (e.g. a required field left blank) that keeps confirm locked regardless of
  // the hold timer/typed text
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

  if (!armed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={variant}
            size="icon-sm"
            className={cn("border border-border/60", className)}
            onClick={() => setArmed(true)}
          >
            <Icon icon={icon} />
            <span className="sr-only">{label}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    );
  }

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
