"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/shadcn/utils";

const subscribeToNothing = () => () => {};

// the server can't know, so it renders "Ctrl" and a mac swaps to ⌘ right
// after hydration
const useIsMac = () =>
  useSyncExternalStore(
    subscribeToNothing,
    () => /Mac|iPhone|iPad/.test(navigator.userAgent),
    () => false,
  );

const KEY_LABELS: Record<string, { mac: string; other: string }> = {
  mod: { mac: "⌘", other: "Ctrl" },
  shift: { mac: "⇧", other: "Shift" },
  alt: { mac: "⌥", other: "Alt" },
  enter: { mac: "↵", other: "↵" },
  up: { mac: "↑", other: "↑" },
  down: { mac: "↓", other: "↓" },
  esc: { mac: "esc", other: "esc" },
};

// keyboard shortcut chips. "mod" is ⌘ on macs and Ctrl everywhere else,
// hidden on touch screens since there's no keyboard to press it on
export function Kbd({
  keys,
  className,
}: {
  keys: string[];
  className?: string;
}) {
  const isMac = useIsMac();
  const getKeyLabel = (key: string) => {
    const labels = KEY_LABELS[key];
    if (!labels) return key.toUpperCase();
    return isMac ? labels.mac : labels.other;
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 pointer-coarse:hidden",
        className,
      )}
    >
      {keys.map((key) => (
        <kbd
          key={key}
          className="inline-grid h-5 min-w-5 place-items-center rounded-md border border-b-2 border-border bg-muted px-1 font-sans text-[0.65rem] font-medium text-muted-foreground"
        >
          {getKeyLabel(key)}
        </kbd>
      ))}
    </span>
  );
}
