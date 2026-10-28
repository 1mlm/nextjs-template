import { useEffect, useRef, useState } from "react";
import { useOnlineStatus } from "@/utils/useOnlineStatus";

export enum SaveState {
  // what's on screen is what's saved
  Saved = "saved",
  // typed, waiting out the debounce
  Dirty = "dirty",
  Saving = "saving",
  // no connection, it saves by itself once you're back
  Offline = "offline",
  // the save threw, retry() tries again
  Error = "error",
}

// saves a value shortly after it stops changing, so there's no save button
// to forget. waits for the connection instead of failing when offline, and
// ignores a slow older save finishing after a newer one started. pass a
// value that only changes when its content does (a string, a memoized object)
export function useAutosave<T>({
  value,
  save,
  delayMs = 800,
}: {
  value: T;
  save: (value: T) => Promise<void>;
  delayMs?: number;
}) {
  const isOnline = useOnlineStatus();
  const [state, setState] = useState(SaveState.Saved);
  const lastSaved = useRef(value);
  const latestAttempt = useRef(0);
  const saveRef = useRef(save);
  saveRef.current = save;

  const saveNow = async (valueToSave: T) => {
    const attempt = ++latestAttempt.current;
    setState(SaveState.Saving);
    try {
      await saveRef.current(valueToSave);
      lastSaved.current = valueToSave;
      if (attempt === latestAttempt.current) setState(SaveState.Saved);
    } catch {
      if (attempt === latestAttempt.current) setState(SaveState.Error);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: saveNow only reads refs and the setter, the value and connection are what re-arm it
  useEffect(() => {
    if (Object.is(value, lastSaved.current)) return;
    if (!isOnline) return setState(SaveState.Offline);
    setState(SaveState.Dirty);
    const timeout = setTimeout(() => saveNow(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, isOnline, delayMs]);

  return { state, retry: () => saveNow(value) };
}
