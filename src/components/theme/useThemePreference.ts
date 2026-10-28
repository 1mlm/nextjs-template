import { useSyncExternalStore } from "react";
import { safeLocalStorage } from "@/utils/storage";
import { THEME_STORAGE_KEY } from "./ThemeInlineScript";

export type ThemePreference = "device" | "light" | "dark";

const changeListeners = new Set<() => void>();

const getSavedThemePreference = (): ThemePreference => {
  const saved = safeLocalStorage.getItem(THEME_STORAGE_KEY);
  return saved === "light" || saved === "dark" ? saved : "device";
};

// "device" drops the attribute so color-scheme: light dark follows the
// system again, see globals.css
const applyThemePreference = (theme: ThemePreference) => {
  if (theme === "device") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
};

export function setThemePreference(theme: ThemePreference) {
  safeLocalStorage.setItem(THEME_STORAGE_KEY, theme);
  applyThemePreference(theme);
  for (const notify of changeListeners) notify();
}

// another tab changing the theme fires storage here, the inline script in the
// root layout already applied the saved one before first paint
const subscribeToThemePreference = (notify: () => void) => {
  const syncFromOtherTab = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return;
    applyThemePreference(getSavedThemePreference());
    notify();
  };
  changeListeners.add(notify);
  window.addEventListener("storage", syncFromOtherTab);
  return () => {
    changeListeners.delete(notify);
    window.removeEventListener("storage", syncFromOtherTab);
  };
};

export const useThemePreference = () =>
  useSyncExternalStore(
    subscribeToThemePreference,
    getSavedThemePreference,
    () => "device" as const,
  );
