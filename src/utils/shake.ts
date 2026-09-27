// a quick no-no headshake for a field the server just rejected or a submit
// that can't go through yet. animates `translate`, not `transform`, so it
// stacks on top of whatever transform the element already has
const SHAKE_KEYFRAMES = [0, -7, 6, -5, 4, -2, 0].map((offset) => ({
  translate: `${offset}px 0`,
}));

export function shakeElement(element: Element | null | undefined) {
  if (!element) return;
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (prefersReducedMotion) return;
  element.animate(SHAKE_KEYFRAMES, { duration: 420, easing: "ease-out" });
}
