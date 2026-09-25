import { useCallback, useEffect, useRef, useState } from "react";

const SCROLL_FADE_SIZE = 32;

const clampToUnit = (value: number) => Math.min(1, Math.max(0, value));

// masks the scroll container itself instead of an overlay div, so the fade
// looks right over striped rows and the sticky header. the fade ramps in over
// the first SCROLL_FADE_SIZE px instead of snapping on at 1px. the sticky
// checkbox column never fades (it never scrolls away), the fade starts after it
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

// horizontal scroll fade for the table: tracks scroll position + the sticky
// checkbox column width and spits out a css mask-image. remeasures on scroll,
// on resize, and when `remeasureKey` changes. that last one is a plain call and
// not an effect keyed on it, cuz a caller passing a fresh value every render
// would otherwise reattach the listeners every single render (ew)
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
  // container's whole lifetime, this must not re-run on every render
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    updateScrollFade();
    scrollContainer.addEventListener("scroll", updateScrollFade);

    // old browsers (firefox < 69) have no ResizeObserver, a window resize listener
    // still catches viewport changes, just not container-only ones
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

  // just remeasures when the table content changes width (a row got deleted),
  // without touching the listeners
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
