import { useCallback, useEffect, useRef, useState } from "react";

const SCROLL_FADE_SIZE = 32;

const clampToUnit = (value: number) => Math.min(1, Math.max(0, value));

// alpha-masks the scroll container itself (not an overlay) so the fade
// blends correctly over striped/merged row backgrounds and the sticky
// header alike. leftProgress/rightProgress (0-1) ramp up over the first
// SCROLL_FADE_SIZE px of scroll instead of snapping on at 1px, so a tiny
// scroll shows a faint fade and a bigger one shows the full fade.
// the sticky checkbox column stays fully opaque — it never scrolls out of
// view, so fading it would be misleading — the fade starts right after it
function getScrollFadeMask(
  leftProgress: number,
  rightProgress: number,
  stickyRegionWidth: number,
) {
  const leftAlpha = 1 - leftProgress;
  const rightAlpha = 1 - rightProgress;
  const left = `black ${stickyRegionWidth}px, rgba(0,0,0,${leftAlpha}) ${stickyRegionWidth}px, black ${stickyRegionWidth + SCROLL_FADE_SIZE}px`;
  const right = `black calc(100% - ${SCROLL_FADE_SIZE}px), rgba(0,0,0,${rightAlpha})`;
  return `linear-gradient(to right, ${left}, ${right})`;
}

// horizontal scroll-shadow effect for the table's scroll container: tracks
// scroll position (and the sticky checkbox column's width, which the fade
// must start after) and produces a CSS mask-image. Re-measures on scroll,
// on container resize, and whenever `remeasureKey` changes (pass something
// that changes when the table's own content does, e.g. the visible rows
// array) — that remeasure is a plain imperative call, not an effect keyed on
// `remeasureKey`, since a caller re-deriving that value on every render
// (an inline arrow function landing in a dependency array upstream, say)
// would otherwise tear down and reattach the scroll/resize listeners every
// single render instead of once
export function useScrollFade(remeasureKey: unknown) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const checkboxColumnRef = useRef<HTMLTableCellElement>(null);
  const [scrollFade, setScrollFade] = useState({ left: 0, right: 0 });
  const [checkboxColumnWidth, setCheckboxColumnWidth] = useState(0);

  const updateScrollFade = useCallback(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const remainingRight =
      scrollContainer.scrollWidth -
      scrollContainer.clientWidth -
      scrollContainer.scrollLeft;
    const left = clampToUnit(scrollContainer.scrollLeft / SCROLL_FADE_SIZE);
    const right = clampToUnit(remainingRight / SCROLL_FADE_SIZE);
    setScrollFade((prev) =>
      prev.left === left && prev.right === right ? prev : { left, right },
    );
    setCheckboxColumnWidth((prev) => {
      const next = checkboxColumnRef.current?.offsetWidth ?? 0;
      return prev === next ? prev : next;
    });
  }, []);

  // attaches the scroll/resize listeners once and keeps them for the scroll
  // container's whole lifetime — this must not re-run on every render
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    updateScrollFade();
    scrollContainer.addEventListener("scroll", updateScrollFade);

    // ResizeObserver isn't available on older browsers (e.g. Firefox < 69) —
    // falling back to a window resize listener still catches viewport
    // changes, just not container-only resizes, rather than crashing the effect
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateScrollFade);
      return () => {
        scrollContainer.removeEventListener("scroll", updateScrollFade);
        window.removeEventListener("resize", updateScrollFade);
      };
    }

    const resizeObserver = new ResizeObserver(updateScrollFade);
    resizeObserver.observe(scrollContainer);
    return () => {
      scrollContainer.removeEventListener("scroll", updateScrollFade);
      resizeObserver.disconnect();
    };
  }, [updateScrollFade]);

  // separate from listener setup above: just re-measures when the table's
  // own content changes width (e.g. a row gets deleted), without tearing
  // down and reattaching the scroll/resize listeners to do it
  // biome-ignore lint/correctness/useExhaustiveDependencies: remeasureKey is a signal, not a value read here
  useEffect(() => {
    updateScrollFade();
  }, [remeasureKey, updateScrollFade]);

  return {
    scrollContainerRef,
    checkboxColumnRef,
    maskImage: getScrollFadeMask(
      scrollFade.left,
      scrollFade.right,
      checkboxColumnWidth,
    ),
  };
}
