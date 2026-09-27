"use client";

import {
  attachHaptics,
  type HapticPattern,
  isIOS,
  isVibrationSupported,
  PRESETS,
  toVibrateSequence,
} from "@haptics/core";
import { useEffect } from "react";

const HAPTIC_PATTERNS = {
  selection: PRESETS.selection,
  light: PRESETS["impact-light"],
  medium: PRESETS["impact-medium"],
  heavy: PRESETS["impact-heavy"],
  success: PRESETS.success,
  warning: PRESETS.warning,
  error: PRESETS.error,
  nudge: [
    { duration: 80, intensity: 0.8 },
    { delay: 80, duration: 50, intensity: 0.3 },
  ],
} satisfies Record<string, HapticPattern>;

export type HapticPreset = keyof typeof HAPTIC_PATTERNS;

// android (and anything else with the vibration api) buzzes from anywhere.
// iphones ignore this: since ios 26.5 only a real finger on a native switch
// buzzes, that's what TapHaptics below is for
export function triggerHaptic(preset: HapticPreset = "selection") {
  if (!isVibrationSupported()) return;
  navigator.vibrate(toVibrateSequence(HAPTIC_PATTERNS[preset]));
}

// what counts as "something you tap" for the iphone overlay
const TAPPABLE_SELECTOR = [
  "button:not(:disabled)",
  "a[href]",
  "summary",
  ...["button", "tab", "menuitem", "option", "switch", "checkbox", "radio"].map(
    (role) => `[role="${role}"]`,
  ),
].join(", ");

// iphone only: every tappable thing gets an invisible native switch laid over
// it, the finger toggles the switch (that's the one tap apple still turns
// into a real taptic tick) and the click is passed on to the element. a
// data-haptic="success" on an element picks a longer pattern than one tick.
// mounted once in the root layout
export function TapHaptics() {
  useEffect(() => {
    if (!isIOS()) return;
    const patterns = new Map<string, HapticPattern>(
      Object.entries(HAPTIC_PATTERNS),
    );
    const detach = { current: () => {} };
    // it adds an <input> inside react's buttons, doing that before react has
    // hydrated them is a hydration mismatch. a beat after load = all hydrated
    // (no requestIdleCallback, older iphones don't have it)
    const attach = () =>
      setTimeout(() => {
        detach.current = attachHaptics({
          selector: TAPPABLE_SELECTOR,
          getPattern: (name) => patterns.get(name),
        });
      }, 300);
    if (document.readyState === "complete") attach();
    else window.addEventListener("load", attach, { once: true });
    return () => {
      window.removeEventListener("load", attach);
      detach.current();
    };
  }, []);
  return null;
}
