import type { TourRect, TourStep } from "./types";

// how long a step waits for its target to appear before giving up: long when
// the step itself opens or loads something, short when the target should
// already be there
export const SLOW_TARGET_WAIT_MS = 4000;
export const QUICK_TARGET_WAIT_MS = 800;
// how long a target can vanish mid step (a re-render swapping the element)
// before the highlight lets go and the card falls back to the middle
export const TARGET_MISSING_GRACE_MS = 500;
const SETTLE_FRAMES = 4;
const SETTLE_TIMEOUT_MS = 1500;
// a target this close to the viewport edge still gets scrolled to the middle
const VIEWPORT_MARGIN_PX = 72;

const isUsable = (element: HTMLElement) => {
  const { width, height } = element.getBoundingClientRect();
  return element.isConnected && width > 0 && height > 0;
};

// a selector may match several elements (the sidebar and the phone tab bar
// both say data-tour="nav", only one is on screen), the first one with a size wins
export function findTarget(target: TourStep["target"]) {
  if (!target) return null;
  if (typeof target === "function") {
    const element = target();
    return element && isUsable(element) ? element : null;
  }
  return (
    Array.from(document.querySelectorAll<HTMLElement>(target)).find(isUsable) ??
    null
  );
}

const isClipping = ({ overflowX, overflowY }: CSSStyleDeclaration) =>
  [overflowX, overflowY].some((value) => value !== "visible");

// what of the element can actually be seen: its box cut down by every
// scrolling or clipping ancestor and by the screen. a table header wider than
// its scroll box would otherwise get a highlight running off both sides
function getVisibleBox(element: HTMLElement) {
  const box = element.getBoundingClientRect();
  let { left, top, right, bottom } = box;
  for (
    let parent = element.parentElement;
    parent && parent !== document.documentElement;
    parent = parent.parentElement
  ) {
    if (!isClipping(getComputedStyle(parent))) continue;
    const clip = parent.getBoundingClientRect();
    left = Math.max(left, clip.left);
    top = Math.max(top, clip.top);
    right = Math.min(right, clip.right);
    bottom = Math.min(bottom, clip.bottom);
  }
  left = Math.max(left, 0);
  top = Math.max(top, 0);
  right = Math.min(right, window.innerWidth);
  bottom = Math.min(bottom, window.innerHeight);
  // nothing visible at all, fall back to the whole box
  return right > left && bottom > top ? { left, top, right, bottom } : box;
}

export function readTargetRect(
  element: HTMLElement,
  padding: number,
): TourRect {
  const { left, top, right, bottom } = getVisibleBox(element);
  const targetRadius = Number.parseFloat(
    getComputedStyle(element).borderTopLeftRadius,
  );
  return {
    x: left - padding,
    y: top - padding,
    width: right - left + padding * 2,
    height: bottom - top + padding * 2,
    radius: (Number.isNaN(targetRadius) ? 0 : targetRadius) + padding,
  };
}

export const hasRectChanged = (a: TourRect, b: TourRect) =>
  Math.abs(a.x - b.x) > 0.5 ||
  Math.abs(a.y - b.y) > 0.5 ||
  Math.abs(a.width - b.width) > 0.5 ||
  Math.abs(a.height - b.height) > 0.5;

// resolves with the element as soon as it exists and has a size, or null
// after the timeout. watches the dom for it, and also polls because a target
// can become usable without any dom change (a transition ending)
export function waitForTarget(
  target: TourStep["target"],
  signal: AbortSignal,
  waitMs: number,
) {
  return new Promise<HTMLElement | null>((resolve) => {
    const finish = (element: HTMLElement | null) => {
      observer.disconnect();
      clearInterval(interval);
      clearTimeout(timeout);
      signal.removeEventListener("abort", giveUp);
      resolve(element);
    };
    const check = () => {
      const element = findTarget(target);
      if (element) finish(element);
    };
    const giveUp = () => finish(null);
    const observer = new MutationObserver(check);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });
    const interval = setInterval(check, 100);
    const timeout = setTimeout(giveUp, waitMs);
    signal.addEventListener("abort", giveUp);
    check();
  });
}

// resolves once the element has stopped moving for a few frames, so the card
// doesn't fly around chasing a smooth scroll or a sidebar sliding open
function waitForStillness(element: HTMLElement, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const startedAt = performance.now();
    let last = element.getBoundingClientRect();
    let stillFrames = 0;
    const check = () => {
      const rect = element.getBoundingClientRect();
      const isStill =
        Math.abs(rect.top - last.top) < 0.5 &&
        Math.abs(rect.left - last.left) < 0.5;
      stillFrames = isStill ? stillFrames + 1 : 0;
      last = rect;
      const isDone =
        stillFrames >= SETTLE_FRAMES ||
        performance.now() - startedAt > SETTLE_TIMEOUT_MS ||
        signal.aborted;
      if (isDone) resolve();
      else requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  });
}

export async function scrollTargetIntoView(
  element: HTMLElement,
  signal: AbortSignal,
) {
  const { top, bottom, left, right } = element.getBoundingClientRect();
  const isComfortablyInView =
    top >= VIEWPORT_MARGIN_PX &&
    bottom <= window.innerHeight - VIEWPORT_MARGIN_PX &&
    left >= 0 &&
    right <= window.innerWidth;
  if (!isComfortablyInView) {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    element.scrollIntoView({
      block: "center",
      inline: "center",
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }
  await waitForStillness(element, signal);
}
