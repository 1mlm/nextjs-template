import { type RefObject, useEffect, useEffectEvent } from "react";

// calls onResize once on mount and again whenever any of the elements
// changes size (content reflow, window resize, font load...)
export function useResizeObserver(
  targets: RefObject<Element | null>[],
  onResize: () => void,
) {
  const handleResize = useEffectEvent(onResize);

  // biome-ignore lint/correctness/useExhaustiveDependencies: the refs are stable objects, observing once on mount is the point
  useEffect(() => {
    handleResize();
    const observer = new ResizeObserver(() => handleResize());
    for (const target of targets)
      if (target.current) observer.observe(target.current);
    return () => observer.disconnect();
  }, []);
}
