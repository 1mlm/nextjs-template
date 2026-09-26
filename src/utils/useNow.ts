import { useSyncExternalStore } from "react";

// one shared clock for every live timestamp on the page, it only ticks while
// something is subscribed. a second is the smallest unit anything shows
// (formatDetailedDuration's "and 12 seconds")
const listeners = new Set<() => void>();
const clock = { now: Date.now(), interval: 0 };

const subscribeToClock = (onTick: () => void) => {
  listeners.add(onTick);
  if (listeners.size === 1) {
    clock.now = Date.now();
    clock.interval = window.setInterval(() => {
      clock.now = Date.now();
      for (const listener of listeners) listener();
    }, 1000);
  }
  return () => {
    listeners.delete(onTick);
    if (listeners.size === 0) window.clearInterval(clock.interval);
  };
};

// null on the server and during hydration: "now" and the timezone differ
// between the two, so anything built from it only renders in the browser
export const useNow = () =>
  useSyncExternalStore(
    subscribeToClock,
    () => clock.now,
    () => null,
  );
