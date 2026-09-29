"use client";

import {
  PauseIcon,
  PictureInPictureExitIcon,
  PictureInPictureOnIcon,
  PlayIcon,
  TimerResetIcon,
} from "@hugeicons/core-free-icons";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/Icon";
import { SquircleRing } from "@/components/SquircleRing";
import { Button } from "@/shadcn/ui/button";
import { cn } from "@/shadcn/utils";
import { triggerConfetti } from "@/utils/confetti";
import { triggerHaptic } from "@/utils/haptics";
import { Chime, playChime } from "@/utils/sound";
import { useIsClient } from "@/utils/useIsClient";

const TICK_MS = 250;

const formatClock = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

// the floating window starts with no styles at all, so it gets a copy of
// every stylesheet on this page (cross origin ones can't be read, those are
// linked instead)
function copyStylesheets(target: Document) {
  for (const sheet of document.styleSheets) {
    try {
      const style = target.createElement("style");
      style.textContent = Array.from(
        sheet.cssRules,
        (rule) => rule.cssText,
      ).join("");
      target.head.appendChild(style);
    } catch {
      if (!sheet.href) continue;
      const link = target.createElement("link");
      link.rel = "stylesheet";
      link.href = sheet.href;
      target.head.appendChild(link);
    }
  }
}

function TimerFace({
  secondsLeft,
  totalSeconds,
  isRunning,
  onToggle,
  onReset,
  floatButton,
}: {
  secondsLeft: number;
  totalSeconds: number;
  isRunning: boolean;
  onToggle: () => void;
  onReset: () => void;
  floatButton?: ReactNode;
}) {
  const remaining = secondsLeft / totalSeconds;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative size-40">
        <SquircleRing progress={remaining} inset={5} />
        <span
          role="timer"
          className="absolute inset-0 flex items-center justify-center text-4xl font-bold tabular-nums"
        >
          {formatClock(secondsLeft)}
        </span>
      </div>
      <div className="flex gap-2">
        <Button onClick={onToggle}>
          <Icon icon={isRunning ? PauseIcon : PlayIcon} />
          {isRunning ? "Pause" : "Start"}
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Reset"
          onClick={onReset}
        >
          <Icon icon={TimerResetIcon} />
        </Button>
        {floatButton}
      </div>
    </div>
  );
}

// a countdown that keeps the screen awake while it runs (screen wake lock)
// and can pop out into a small always-on-top window (document picture in
// picture, chrome and edge) so it stays visible over your other apps
export function FocusTimer({
  minutes = 25,
  className,
}: {
  minutes?: number;
  className?: string;
}) {
  const totalSeconds = minutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [floatingWindow, setFloatingWindow] = useState<Window>();
  const endsAt = useRef(0);
  const isClient = useIsClient();
  const canFloat = isClient && "documentPictureInPicture" in window;

  const toggle = () => {
    triggerHaptic("light");
    if (!isRunning) endsAt.current = Date.now() + secondsLeft * 1000;
    setIsRunning(!isRunning);
  };

  const reset = () => {
    setIsRunning(false);
    setSecondsLeft(totalSeconds);
  };

  // counts against the clock, not by adding a second per tick, so a busy tab or a background throttle can't make it drift
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      const left = Math.max(0, Math.ceil((endsAt.current - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left > 0) return;
      setIsRunning(false);
      triggerHaptic("success");
      playChime(Chime.Success);
      triggerConfetti();
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning || !navigator.wakeLock) return;
    const request = navigator.wakeLock.request("screen").catch(() => undefined);
    return () => {
      request.then((lock) => lock?.release());
    };
  }, [isRunning]);

  const float = async () => {
    if (!window.documentPictureInPicture) return;
    const popup = await window.documentPictureInPicture.requestWindow({
      width: 280,
      height: 300,
    });
    copyStylesheets(popup.document);
    popup.document.body.className = `${document.body.className} flex items-center justify-center bg-background text-foreground`;
    popup.addEventListener("pagehide", () => setFloatingWindow(undefined));
    setFloatingWindow(popup);
  };

  const face = (
    <TimerFace
      {...{ secondsLeft, totalSeconds, isRunning }}
      onToggle={toggle}
      onReset={reset}
      floatButton={
        canFloat && (
          <Button
            variant="outline"
            size="icon"
            aria-label={floatingWindow ? "Bring back" : "Float over other apps"}
            onClick={floatingWindow ? () => floatingWindow.close() : float}
          >
            <Icon
              icon={
                floatingWindow
                  ? PictureInPictureExitIcon
                  : PictureInPictureOnIcon
              }
            />
          </Button>
        )
      }
    />
  );

  return (
    <div
      className={cn(
        "flex min-h-64 w-full max-w-xs items-center justify-center rounded-3xl border bg-card p-5",
        className,
      )}
    >
      {floatingWindow ? (
        <>
          <div className="flex flex-col items-center gap-3 text-center text-sm text-muted-foreground">
            <p>
              floating over your other apps
              <br />
              {formatClock(secondsLeft)} left
            </p>
            <Button variant="outline" onClick={() => floatingWindow.close()}>
              <Icon icon={PictureInPictureExitIcon} /> Bring it back
            </Button>
          </div>
          {createPortal(face, floatingWindow.document.body)}
        </>
      ) : (
        face
      )}
    </div>
  );
}
