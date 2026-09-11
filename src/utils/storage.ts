// localStorage throws in Safari private browsing, when a browser blocks
// site data, or during SSR where window doesn't exist — every call here
// guards against that instead of crashing the caller
export function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    const testKey = "__storage_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export const safeLocalStorage = {
  getItem(key: string): string | null {
    if (!isLocalStorageAvailable()) return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    if (!isLocalStorageAvailable()) return;
    try {
      window.localStorage.setItem(key, value);
    } catch {}
  },
  removeItem(key: string): void {
    if (!isLocalStorageAvailable()) return;
    try {
      window.localStorage.removeItem(key);
    } catch {}
  },
};
