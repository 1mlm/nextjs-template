"use client";

import type { IconSvgElement } from "@hugeicons/react";
import { motion } from "motion/react";
import { useId } from "react";
import { Icon } from "@/components/Icon";
import { cn } from "@/shadcn/utils";
import { triggerHaptic } from "@/utils/haptics";

export type SlidingTab<T extends string> = {
  value: T;
  label: string;
  icon: IconSvgElement;
};

// tabs where the active pill slides over to whatever you pick instead of
// blinking between them. the pill is one shared layout element, motion moves it
export function SlidingTabs<T extends string>({
  tabs,
  value,
  onValueChange,
  className,
}: {
  tabs: SlidingTab<T>[];
  value: T;
  onValueChange: (value: T) => void;
  className?: string;
}) {
  // a unique layout id per instance, or two tab bars on a page share one pill
  const pillLayoutId = useId();

  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-1 rounded-xl bg-muted p-1",
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => {
              if (isActive) return;
              triggerHaptic("selection");
              onValueChange(tab.value);
            }}
            className={cn(
              "relative flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {isActive && (
              <motion.span
                layoutId={pillLayoutId}
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                className="absolute inset-0 rounded-lg bg-background shadow-sm"
              />
            )}
            <Icon icon={tab.icon} className="relative size-4" />
            <span className="relative">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
