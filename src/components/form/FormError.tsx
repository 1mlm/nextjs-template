"use client";

import { type ReactNode, useEffect } from "react";
import { Icon } from "@/components/Icon";
import { cn } from "@/shadcn/utils";
import { triggerHaptic } from "@/utils/haptics";
import { APP_ICONS } from "@/utils/icons";
import { Chime, playChime } from "@/utils/sound";

// buzzes + plays the error chime the moment an error shows up, not on every re-render while it stays
export function FormError({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const hasError = Boolean(children);

  useEffect(() => {
    if (!hasError) return;
    triggerHaptic("error");
    playChime(Chime.Error);
  }, [hasError]);

  if (!hasError) return null;

  return (
    <span
      role="alert"
      className={cn(
        "inline-flex items-center gap-1.5 text-sm text-destructive",
        className,
      )}
    >
      <Icon icon={APP_ICONS.warning} />
      {children}
    </span>
  );
}
