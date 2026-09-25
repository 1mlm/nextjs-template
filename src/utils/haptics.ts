import { type HapticInput, WebHaptics } from "web-haptics";

// android gets navigator.vibrate, ios gets the hidden <input switch> trick
// (apple never shipped the vibration api, so this is the hackkkk). one
// instance owns that hidden node for the whole app, and there's no dom on
// the server so it just no-ops there
const haptics = typeof window === "undefined" ? null : new WebHaptics();

export const triggerHaptic = (input: HapticInput = "selection") =>
  haptics?.trigger(input);
