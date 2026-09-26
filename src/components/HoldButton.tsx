"use client";

import type { IconSvgElement } from "@hugeicons/react";
import { type ComponentProps, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
import { cn } from "@/shadcn/utils";
import { triggerHaptic } from "@/utils/haptics";
import { Chime, playChime } from "@/utils/sound";

const HOLD_KEYS = new Set([" ", "Enter"]);

// press and hold to confirm, a fill sweeps across while you hold and letting
// go early cancels it. more physical than a confirm dialog for "are you sure"
// actions, and a stray tap can never trigger it. works with space/enter too
export function HoldButton({
  icon,
  children,
  holdMs = 1200,
  onConfirm,
  className,
  ...props
}: Omit<ComponentProps<typeof Button>, "onClick"> & {
  icon: IconSvgElement;
  holdMs?: number;
  onConfirm: () => void;
}) {
  const [isHolding, setIsHolding] = useState(false);
  const holdTimeout = useRef<number>(undefined);

  const startHold = () => {
    if (isHolding) return;
    triggerHaptic("light");
    setIsHolding(true);
    holdTimeout.current = window.setTimeout(() => {
      setIsHolding(false);
      triggerHaptic("success");
      playChime(Chime.Success);
      onConfirm();
    }, holdMs);
  };

  const cancelHold = () => {
    if (!isHolding) return;
    window.clearTimeout(holdTimeout.current);
    setIsHolding(false);
  };

  useEffect(() => () => window.clearTimeout(holdTimeout.current), []);

  return (
    <Button
      {...props}
      onPointerDown={startHold}
      onPointerUp={cancelHold}
      onPointerLeave={cancelHold}
      onPointerCancel={cancelHold}
      onKeyDown={(event) => {
        if (HOLD_KEYS.has(event.key) && !event.repeat) startHold();
      }}
      onKeyUp={(event) => {
        if (HOLD_KEYS.has(event.key)) cancelHold();
      }}
      // no context menu popping up mid hold on a long press
      onContextMenu={(event) => event.preventDefault()}
      className={cn(
        "relative touch-none overflow-hidden select-none",
        className,
      )}
    >
      <span
        aria-hidden
        style={{ transitionDuration: isHolding ? `${holdMs}ms` : "200ms" }}
        className={cn(
          "absolute inset-0 origin-left bg-current/20 ease-linear transition-transform",
          isHolding ? "scale-x-100" : "scale-x-0",
        )}
      />
      <Icon {...{ icon }} className="relative" />
      <span className="relative">
        {isHolding ? "Keep holding..." : children}
      </span>
    </Button>
  );
}
