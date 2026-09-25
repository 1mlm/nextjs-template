import { useSyncExternalStore } from "react";

// fake latency so the demos actually show their pending states
export const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const subscribeToNothing = () => () => {};

// this page is prerendered at build time, so anything reading "now" would
// render build-time text on the server and real-time text on the client
// (hydration mismatch, fun). time demos just skip the server render
export const useIsClient = () =>
  useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
