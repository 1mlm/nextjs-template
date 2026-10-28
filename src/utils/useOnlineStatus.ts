import { useSyncExternalStore } from "react";

const subscribeToOnlineStatus = (notify: () => void) => {
  window.addEventListener("online", notify);
  window.addEventListener("offline", notify);
  return () => {
    window.removeEventListener("online", notify);
    window.removeEventListener("offline", notify);
  };
};

// navigator.onLine only knows if there's a network connection, not whether the
// internet works behind it, so "true" can still mean a failing request
export const useOnlineStatus = () =>
  useSyncExternalStore(
    subscribeToOnlineStatus,
    () => navigator.onLine,
    () => true,
  );
