import { useEffect, useRef, useState } from "react";
import {
  findTarget,
  hasRectChanged,
  QUICK_TARGET_WAIT_MS,
  readTargetRect,
  SLOW_TARGET_WAIT_MS,
  scrollTargetIntoView,
  TARGET_MISSING_GRACE_MS,
  waitForTarget,
} from "./targets";
import type { TourRect, TourStep } from "./types";

export enum TargetStatus {
  // running before(), waiting for the target, scrolling to it
  Preparing = "preparing",
  // a rect to highlight, or no target at all (a centered step)
  Ready = "ready",
  // the target never showed up, or vanished and stayed gone
  Missing = "missing",
}

const DEFAULT_PADDING_PX = 8;
const STALE_RECT_MS = 450;

// follows one step's target for as long as the step is up: waits for it,
// scrolls it into view, then reports its rect every time it moves, from a
// scroll, a resize, a sidebar animating or the page shifting. only the step's
// id restarts it, so a parent passing a fresh steps array each render
// doesn't make the highlight flicker
export function useTourStepTarget(step: TourStep | undefined) {
  const [status, setStatus] = useState(TargetStatus.Preparing);
  const [rect, setRect] = useState<TourRect>();
  const stepRef = useRef(step);
  stepRef.current = step;
  const stepId = step?.id;

  // biome-ignore lint/correctness/useExhaustiveDependencies: the step is read through a ref, its id is the trigger
  useEffect(() => {
    const currentStep = stepRef.current;
    if (!currentStep) return;
    const abort = new AbortController();
    let frame = 0;
    setStatus(TargetStatus.Preparing);
    // the old highlight stays up so it can glide to the new target, unless
    // that takes long (a page loading) and it's pointing at nothing by then
    const dropStaleRect = setTimeout(() => setRect(undefined), STALE_RECT_MS);

    const follow = async () => {
      await currentStep.before?.();
      if (abort.signal.aborted) return;
      if (!currentStep.target) {
        setRect(undefined);
        return setStatus(TargetStatus.Ready);
      }

      const waitMs =
        currentStep.waitMs ??
        (currentStep.before ? SLOW_TARGET_WAIT_MS : QUICK_TARGET_WAIT_MS);
      const element = await waitForTarget(
        currentStep.target,
        abort.signal,
        waitMs,
      );
      if (!element) {
        setRect(undefined);
        return setStatus(TargetStatus.Missing);
      }
      await scrollTargetIntoView(element, abort.signal);
      if (abort.signal.aborted) return;
      clearTimeout(dropStaleRect);

      const padding = currentStep.spotlightPadding ?? DEFAULT_PADDING_PX;
      let lastRect: TourRect | undefined;
      let missingSince: number | undefined;
      const track = (now: number) => {
        // looked up again every frame, a re-render may have replaced it
        const target = findTarget(currentStep.target);
        if (target) {
          missingSince = undefined;
          const nextRect = readTargetRect(target, padding);
          if (!lastRect || hasRectChanged(lastRect, nextRect)) {
            lastRect = nextRect;
            setRect(nextRect);
          }
          setStatus(TargetStatus.Ready);
        } else {
          missingSince ??= now;
          if (now - missingSince > TARGET_MISSING_GRACE_MS && lastRect) {
            lastRect = undefined;
            setRect(undefined);
            setStatus(TargetStatus.Missing);
          }
        }
        frame = requestAnimationFrame(track);
      };
      frame = requestAnimationFrame(track);
    };
    follow();

    return () => {
      abort.abort();
      clearTimeout(dropStaleRect);
      cancelAnimationFrame(frame);
    };
  }, [stepId]);

  return { status, rect };
}
