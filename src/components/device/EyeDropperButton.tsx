"use client";

import { ColorPickerIcon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
import { cn } from "@/shadcn/utils";
import { useCopyToClipboard } from "@/utils/clipboard";
import { triggerHaptic } from "@/utils/haptics";
import { APP_ICONS } from "@/utils/icons";
import { useIsClient } from "@/utils/useIsClient";

// pick any color on your screen, even outside the browser window, with the
// native eyedropper. chrome and edge only, other browsers get a disabled
// button that says so. the picked hex sits next to it, tap it to copy
export function EyeDropperButton({
  onPick,
  className,
}: {
  onPick?: (hex: string) => void;
  className?: string;
}) {
  const [color, setColor] = useState<string>();
  const { copied, copy } = useCopyToClipboard();
  const isClient = useIsClient();
  const isSupported = isClient && "EyeDropper" in window;

  const pick = async () => {
    try {
      const { sRGBHex } = await new EyeDropper().open();
      triggerHaptic("selection");
      setColor(sRGBHex);
      onPick?.(sRGBHex);
    } catch {
      // escape closes the picker by rejecting, nothing to do
    }
  };

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="flex items-center gap-2">
        <Button disabled={!isSupported} onClick={pick}>
          <Icon icon={ColorPickerIcon} /> Pick a color
        </Button>
        {color && (
          <Button
            variant="outline"
            className="cursor-copy font-mono"
            onClick={() => copy(color)}
          >
            <span
              style={{ background: color }}
              className="size-4 rounded-md border"
            />
            {color}
            <Icon icon={copied ? APP_ICONS.confirm : APP_ICONS.copy} />
          </Button>
        )}
      </div>
      {isClient && !isSupported && (
        <p className="text-sm text-muted-foreground">
          this browser has no eyedropper, chrome and edge do
        </p>
      )}
    </div>
  );
}
