"use client";

import { ConstructionIcon, RefreshIcon } from "@hugeicons/core-free-icons";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
import { APP_INFO } from "../_sidebar/nav";

const RETRY_EVERY_SECONDS = 30;

// what every page turns into while MAINTENANCE_MODE is on (see layout.tsx).
// it retries on its own so nobody has to sit there mashing reload
export function Maintenance() {
  const [secondsLeft, setSecondsLeft] = useState(RETRY_EVERY_SECONDS);

  useEffect(() => {
    const interval = window.setInterval(
      () => setSecondsLeft((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (secondsLeft === 0) window.location.reload();
  }, [secondsLeft]);

  const progressPercent =
    ((RETRY_EVERY_SECONDS - secondsLeft) / RETRY_EVERY_SECONDS) * 100;

  return (
    <main className="grid min-h-dvh place-items-center bg-muted p-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-5 rounded-3xl bg-background p-8 text-center shadow-sm ring-1 ring-border">
        <span className="grid size-16 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg motion-safe:animate-[wiggle_1.6s_ease-in-out_infinite]">
          <Icon icon={ConstructionIcon} className="size-8" />
        </span>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-semibold">Hang tight, we're shipping</h1>
          <p className="text-sm text-muted-foreground">
            {APP_INFO.name} is getting an update, it'll be back in a minute or
            two. nothing you did, promise
          </p>
        </div>
        <div className="flex w-full flex-col gap-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground tabular-nums">
            checking again in {secondsLeft}s
          </p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <Icon icon={RefreshIcon} />
          Try now
        </Button>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-amber-500 motion-safe:animate-pulse" />
          status: deploying
        </span>
      </div>
    </main>
  );
}
