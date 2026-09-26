import { useSyncExternalStore } from "react";

const subscribeToNothing = () => () => {};

// anything reading "now" or the local timezone renders one thing on the
// server and another in the browser (hydration mismatch, fun), so those
// just skip the server render
export const useIsClient = () =>
  useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
