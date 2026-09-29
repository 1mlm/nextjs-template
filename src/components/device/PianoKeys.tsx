"use client";

import { type KeyboardEvent, useState } from "react";
import { cn } from "@/shadcn/utils";
import { triggerHaptic } from "@/utils/haptics";
import { playNote } from "@/utils/sound";

const WHITE_KEYS = [
  { note: "C", frequency: 261.63, shortcut: "a" },
  { note: "D", frequency: 293.66, shortcut: "s" },
  { note: "E", frequency: 329.63, shortcut: "d" },
  { note: "F", frequency: 349.23, shortcut: "f" },
  { note: "G", frequency: 392, shortcut: "g" },
  { note: "A", frequency: 440, shortcut: "h" },
  { note: "B", frequency: 493.88, shortcut: "j" },
  { note: "C", frequency: 523.25, shortcut: "k" },
];

// each black key sits on the seam after the white key at `after`
const BLACK_KEYS = [
  { note: "C#", frequency: 277.18, shortcut: "w", after: 0 },
  { note: "D#", frequency: 311.13, shortcut: "e", after: 1 },
  { note: "F#", frequency: 369.99, shortcut: "t", after: 3 },
  { note: "G#", frequency: 415.3, shortcut: "y", after: 4 },
  { note: "A#", frequency: 466.16, shortcut: "u", after: 5 },
];

const PRESS_MS = 160;

// a one octave piano. click, tap or drag across the keys, or focus it and
// play with the keyboard (a s d f g h j k, the black ones are w e t y u).
// the notes are synthesized with the web audio api, no samples to ship
export function PianoKeys({ className }: { className?: string }) {
  const [pressedShortcut, setPressedShortcut] = useState<string>();

  const press = (frequency: number, shortcut: string) => {
    playNote(frequency);
    triggerHaptic("selection");
    setPressedShortcut(shortcut);
    setTimeout(
      () =>
        setPressedShortcut((current) =>
          current === shortcut ? undefined : current,
        ),
      PRESS_MS,
    );
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.repeat) return;
    const key = [...WHITE_KEYS, ...BLACK_KEYS].find(
      ({ shortcut }) => shortcut === event.key.toLowerCase(),
    );
    if (key) press(key.frequency, key.shortcut);
  };

  const getKeyProps = (frequency: number, shortcut: string) => ({
    tabIndex: -1,
    onPointerDown: () => press(frequency, shortcut),
    // dragging across the keys with the button down plays each one it crosses
    onPointerEnter: (event: React.PointerEvent) => {
      if (event.buttons === 1 && event.pointerType === "mouse")
        press(frequency, shortcut);
    },
  });

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: it only listens for the piano shortcuts, the keys inside are the real buttons
    <div
      // biome-ignore lint/a11y/noNoninteractiveTabindex: focusing the piano is what turns the keyboard shortcuts on
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={cn(
        "relative flex h-40 w-full max-w-sm rounded-3xl border bg-card p-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      {WHITE_KEYS.map(({ note, frequency, shortcut }) => (
        <button
          key={shortcut}
          type="button"
          {...getKeyProps(frequency, shortcut)}
          className={cn(
            "flex flex-1 cursor-pointer touch-none items-end justify-center rounded-b-xl border-x pb-2 text-xs text-muted-foreground transition-[background-color,translate] duration-100 select-none first:rounded-bl-2xl last:rounded-br-2xl",
            pressedShortcut === shortcut
              ? "translate-y-0.5 bg-muted"
              : "hover:bg-muted/50",
          )}
        >
          {note}
        </button>
      ))}
      {BLACK_KEYS.map(({ frequency, shortcut, after, note }) => (
        <button
          key={shortcut}
          type="button"
          aria-label={note}
          {...getKeyProps(frequency, shortcut)}
          style={{
            left: `calc(0.5rem + (100% - 1rem) * ${(after + 1) / WHITE_KEYS.length})`,
          }}
          className={cn(
            "absolute top-2 h-[58%] w-[9%] -translate-x-1/2 cursor-pointer touch-none rounded-b-lg bg-foreground transition-[opacity,translate] duration-100 select-none",
            pressedShortcut === shortcut
              ? "translate-y-0.5 opacity-70"
              : "hover:opacity-85",
          )}
        />
      ))}
    </div>
  );
}
