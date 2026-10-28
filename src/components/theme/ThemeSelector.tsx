"use client";

import {
  ComputerIcon,
  Moon02Icon,
  Sun01Icon,
} from "@hugeicons/core-free-icons";
import { type SlidingTab, SlidingTabs } from "@/components/SlidingTabs";
import {
  setThemePreference,
  type ThemePreference,
  useThemePreference,
} from "./useThemePreference";

const THEME_TABS: SlidingTab<ThemePreference>[] = [
  { value: "device", label: "Auto", icon: ComputerIcon },
  { value: "light", label: "Light", icon: Sun01Icon },
  { value: "dark", label: "Dark", icon: Moon02Icon },
];

export function ThemeSelector({ className }: { className?: string }) {
  const theme = useThemePreference();

  return (
    <SlidingTabs
      tabs={THEME_TABS}
      value={theme}
      onValueChange={setThemePreference}
      {...{ className }}
    />
  );
}
