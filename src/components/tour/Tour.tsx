"use client";

import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Loading01Icon,
} from "@hugeicons/core-free-icons";
import { type CSSProperties, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/Icon";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";
import { Button } from "@/shadcn/ui/button";
import { Popover, PopoverAnchor, PopoverContent } from "@/shadcn/ui/popover";
import { cn } from "@/shadcn/utils";
import { triggerHaptic } from "@/utils/haptics";
import { findTarget } from "./targets";
import type { TourRect, TourStep } from "./types";
import { TargetStatus, useTourStepTarget } from "./useTourStepTarget";

// above everything the app puts on top, dialogs, sheets and toasts included
const OVERLAY_Z = "z-[100]";
const CARD_Z = "z-[101]";
const MOVE_ANIMATION_MS = 320;

function TourCard({
  step,
  index,
  total,
  onBack,
  onNext,
  onSkip,
  onGoTo,
  nextRef,
  className,
}: {
  step: TourStep;
  index: number;
  total: number;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  onGoTo: (index: number) => void;
  nextRef: React.RefObject<HTMLButtonElement | null>;
  className?: string;
}) {
  const titleId = useId();
  const bodyId = useId();
  const isLast = index === total - 1;

  // each step's card appears fresh, focus goes to its main button so enter
  // and space keep the tour moving
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new step is the trigger
  useEffect(() => {
    nextRef.current?.focus({ preventScroll: true });
  }, [step.id]);

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      className={cn("flex w-80 max-w-full flex-col gap-3 p-1", className)}
    >
      <div className="flex flex-col gap-1">
        <h2 id={titleId} className="text-base font-semibold">
          {step.title}
        </h2>
        <div id={bodyId} className="text-sm text-muted-foreground">
          {step.body}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {Array.from({ length: total }, (_, dot) => (
            <button
              // the tour's steps never reorder, the position is the identity
              // biome-ignore lint/suspicious/noArrayIndexKey: static list
              key={dot}
              type="button"
              aria-label={`Go to step ${dot + 1} of ${total}`}
              aria-current={dot === index ? "step" : undefined}
              onClick={() => onGoTo(dot)}
              className="grid size-4 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <span
                className={cn(
                  "h-1.5 rounded-full corner-round transition-all",
                  dot === index
                    ? "w-4 bg-foreground"
                    : "w-1.5 bg-foreground/25",
                )}
              />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {!isLast && (
            <Button variant="ghost" size="sm" onClick={onSkip}>
              Skip
            </Button>
          )}
          {index > 0 && (
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Previous step"
              onClick={onBack}
            >
              <Icon icon={ArrowLeft01Icon} />
            </Button>
          )}
          <Button ref={nextRef} size="sm" onClick={onNext}>
            {isLast ? "Done" : "Next"}
            {!isLast && <Icon icon={ArrowRight01Icon} />}
          </Button>
        </div>
      </div>
    </div>
  );
}

// a step that waits on a slow page shows this after a beat, so a gap with
// a dimmed screen and nothing else doesn't look like a freeze
function LoadingHint() {
  const [isShown, setIsShown] = useState(false);
  useEffect(() => {
    const showTimeout = setTimeout(() => setIsShown(true), 400);
    return () => clearTimeout(showTimeout);
  }, []);
  if (!isShown) return null;
  return (
    <div
      role="status"
      className={cn(
        "fixed top-1/2 left-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-popover text-popover-foreground shadow-lg",
        CARD_Z,
      )}
    >
      <Icon icon={Loading01Icon} isLoading />
      <span className="sr-only">Loading the next step</span>
    </div>
  );
}

// the dimmed page with a hole over the target. four invisible panels around
// the hole block clicks, so only the target can be pressed (when the step
// says so). the hole is what draws the dim, a huge shadow around it
function Spotlight({
  rect,
  isInteractive,
  isMoving,
}: {
  rect: TourRect;
  isInteractive: boolean;
  isMoving: boolean;
}) {
  const panel = cn("fixed", OVERLAY_Z);
  const right = rect.x + rect.width;
  const bottom = rect.y + rect.height;
  return (
    <>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none fixed shadow-[0_0_0_100vmax_rgb(0_0_0/0.6)]",
          OVERLAY_Z,
          isMoving &&
            "transition-[left,top,width,height] duration-300 ease-out motion-reduce:transition-none",
        )}
        style={{
          left: rect.x,
          top: rect.y,
          width: rect.width,
          height: rect.height,
          borderRadius: rect.radius,
        }}
      />
      <div
        className={panel}
        style={{ inset: `0 0 auto 0`, height: Math.max(rect.y, 0) }}
      />
      <div className={panel} style={{ inset: `${bottom}px 0 0 0` }} />
      <div
        className={panel}
        style={{
          top: rect.y,
          height: rect.height,
          left: 0,
          width: Math.max(rect.x, 0),
        }}
      />
      <div
        className={panel}
        style={{ top: rect.y, height: rect.height, left: right, right: 0 }}
      />
      {!isInteractive && (
        <div
          className={panel}
          style={{
            left: rect.x,
            top: rect.y,
            width: rect.width,
            height: rect.height,
          }}
        />
      )}
    </>
  );
}

// a guided walk through the page: dims everything but one element at a time
// and explains it. built to be dropped into any app:
// - steps point at things with a css selector (put data-tour="x" on them) or
//   a function, and wait for them to exist, so a step can open a menu or
//   change page first (before)
// - it follows the target while the page scrolls, resizes or animates
// - a step whose target is gone is skipped or shown in the middle
// - keyboard: right arrow or enter for next, left arrow back, escape closes
// - phones get the card docked at the screen's top or bottom, whichever the
//   target isn't under. focus goes to the card and back where it was after
// it renders nothing while closed, you own `open`
export function Tour({
  steps,
  open,
  onOpenChange,
  onFinish,
  onSkip,
}: {
  steps: TourStep[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFinish?: () => void;
  // the step it was on, to see where people give up
  onSkip?: (stepId: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const isMobile = useIsMobile();
  const step = steps[index];
  const { status, rect } = useTourStepTarget(open ? step : undefined);
  const nextRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<Element | null>(null);

  // the popover is anchored to the highlight through a stand in element that
  // always answers with the latest rect, read on every frame by popper
  const rectRef = useRef(rect);
  rectRef.current = rect;
  const anchorRef = useRef({
    getBoundingClientRect: () => {
      const current = rectRef.current;
      return DOMRect.fromRect(
        current && {
          x: current.x,
          y: current.y,
          width: current.width,
          height: current.height,
        },
      );
    },
  });

  const close = (reason: "finish" | "skip") => {
    step?.after?.();
    if (reason === "finish") onFinish?.();
    else if (step) onSkip?.(step.id);
    onOpenChange(false);
  };

  const goTo = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= steps.length) return;
    triggerHaptic("selection");
    step?.after?.();
    setIndex(nextIndex);
  };
  const next = () =>
    index === steps.length - 1 ? close("finish") : goTo(index + 1);
  const back = () => goTo(index - 1);

  // starts from the top every time it opens, and puts focus back after
  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement;
    setIndex(0);
    return () => {
      if (previousFocus.current instanceof HTMLElement)
        previousFocus.current.focus({ preventScroll: true });
    };
  }, [open]);

  // a step whose target is gone and wants to be skipped
  // biome-ignore lint/correctness/useExhaustiveDependencies: only the status turning missing should trigger it
  useEffect(() => {
    if (open && status === TargetStatus.Missing && step?.skipIfMissing) next();
  }, [status]);

  // the highlight glides to the next target, but not while it's tracking a
  // scroll (a transition there would trail behind the element)
  // biome-ignore lint/correctness/useExhaustiveDependencies: the step changing is the trigger
  useEffect(() => {
    if (!open) return;
    setIsMoving(true);
    const stopTimeout = setTimeout(() => setIsMoving(false), MOVE_ANIMATION_MS);
    return () => clearTimeout(stopTimeout);
  }, [open, index]);

  // the click that is the point of the step moves the tour along
  // biome-ignore lint/correctness/useExhaustiveDependencies: next closes over the current index, the step is what changes it
  useEffect(() => {
    if (!open || status !== TargetStatus.Ready || !step?.advanceOnClick) return;
    const target = findTarget(step.target);
    if (!target) return;
    const advance = () => setTimeout(next, 0);
    target.addEventListener("click", advance, { once: true });
    return () => target.removeEventListener("click", advance);
  }, [open, status, step?.id]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close("skip");
      else if (event.key === "ArrowRight") next();
      else if (event.key === "ArrowLeft") back();
      else return;
      event.preventDefault();
      event.stopPropagation();
    };
    window.addEventListener("keydown", handleKey, true);
    return () => window.removeEventListener("keydown", handleKey, true);
  });

  if (!open || !step || typeof document === "undefined") return null;

  // the old highlight stays while the next target is being found
  const hasHighlight = Boolean(rect) && status !== TargetStatus.Missing;
  const isPreparing = status === TargetStatus.Preparing;
  const cardProps = {
    step,
    index,
    total: steps.length,
    onBack: back,
    onNext: next,
    onSkip: () => close("skip"),
    onGoTo: goTo,
    nextRef,
  };
  // under the target's half of the screen, so the card never covers it
  const dockOnTop = Boolean(
    rect && rect.y + rect.height / 2 > window.innerHeight / 2,
  );
  const dockedStyle: CSSProperties = dockOnTop
    ? { top: "max(0.75rem, env(safe-area-inset-top))" }
    : { bottom: "max(0.75rem, env(safe-area-inset-bottom))" };

  return createPortal(
    <>
      <span role="status" className="sr-only">
        {`Step ${index + 1} of ${steps.length}: ${step.title}`}
      </span>
      {hasHighlight && rect ? (
        <Spotlight
          {...{ rect, isMoving }}
          isInteractive={Boolean(step.interactive || step.advanceOnClick)}
        />
      ) : (
        <div className={cn("fixed inset-0 bg-black/60", OVERLAY_Z)} />
      )}
      {isPreparing && <LoadingHint />}
      {!isPreparing && hasHighlight && !isMobile && (
        <Popover open>
          <PopoverAnchor virtualRef={anchorRef} />
          <PopoverContent
            side={step.placement ?? "bottom"}
            align="center"
            sideOffset={10}
            collisionPadding={12}
            updatePositionStrategy="always"
            // the tour owns focus and escape, radix closing it would desync
            onOpenAutoFocus={(event) => event.preventDefault()}
            onCloseAutoFocus={(event) => event.preventDefault()}
            onEscapeKeyDown={(event) => event.preventDefault()}
            onInteractOutside={(event) => event.preventDefault()}
            // an open modal dialog turns pointer events off for the body
            style={{ pointerEvents: "auto" }}
            className={cn("w-auto p-3", CARD_Z)}
          >
            <TourCard {...cardProps} />
          </PopoverContent>
        </Popover>
      )}
      {!isPreparing && hasHighlight && isMobile && (
        <div
          style={dockedStyle}
          className={cn(
            "fixed inset-x-3 rounded-2xl bg-popover p-3 text-popover-foreground shadow-xl ring-1 ring-foreground/10 animate-in fade-in-0 slide-in-from-bottom-2",
            CARD_Z,
          )}
        >
          <TourCard {...cardProps} className="w-full" />
        </div>
      )}
      {!isPreparing && !hasHighlight && (
        <div
          className={cn(
            "fixed top-1/2 left-1/2 w-[min(22rem,calc(100vw-1.5rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-popover p-4 text-popover-foreground shadow-xl ring-1 ring-foreground/10 animate-in fade-in-0 zoom-in-95",
            CARD_Z,
          )}
        >
          <TourCard {...cardProps} className="w-full" />
        </div>
      )}
    </>,
    document.body,
  );
}
