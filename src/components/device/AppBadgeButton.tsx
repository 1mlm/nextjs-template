"use client";

import { useState } from "react";
import { Button } from "@/shadcn/ui/button";
import { triggerHaptic } from "@/utils/haptics";
import { useIsClient } from "@/utils/useIsClient";

// the number on the installed app's icon (dock, taskbar, home screen). only
// works once the app is installed, on a plain tab the calls do nothing
export function AppBadgeButton() {
  const isClient = useIsClient();
  const [count, setCount] = useState(0);
  const isSupported = isClient && "setAppBadge" in navigator;

  const changeCount = (nextCount: number) => {
    triggerHaptic("selection");
    setCount(nextCount);
    if (nextCount === 0) navigator.clearAppBadge();
    else navigator.setAppBadge(nextCount);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          disabled={!isSupported}
          onClick={() => changeCount(count + 1)}
        >
          Badge the icon ({count})
        </Button>
        <Button
          variant="ghost"
          disabled={!isSupported || count === 0}
          onClick={() => changeCount(0)}
        >
          Clear
        </Button>
      </div>
      {isClient && !isSupported && (
        <span className="text-xs text-muted-foreground">
          this browser has no badging api
        </span>
      )}
    </div>
  );
}
