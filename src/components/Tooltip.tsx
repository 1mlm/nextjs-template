"use client";

import {
  type ComponentProps,
  createContext,
  useContext,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Tooltip as TooltipPrimitive,
  TooltipTrigger as TooltipTriggerPrimitive,
} from "@/shadcn/ui/tooltip";

const TAP_TOOLTIP_VISIBLE_MS = 1600;

const HOVER_QUERY = "(hover: hover)";

const subscribeToHoverQuery = (onChange: () => void) => {
  const query = window.matchMedia(HOVER_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

// server snapshot assumes a mouse, a phone just swaps to tap mode right after hydration
const useHasHoverSupport = () =>
  useSyncExternalStore(
    subscribeToHoverQuery,
    () => window.matchMedia(HOVER_QUERY).matches,
    () => true,
  );

const TapTooltipContext = createContext<(() => void) | null>(null);

// radix tooltips only open on hover/focus, and a tap on a phone gives you
// neither (the label never shows or flashes for like one frame, so annoyingggg).
// on touch devices the tap now also pops the tooltip for a bit before it
// auto-hides, mouse devices get plain radix behavior untouched
export function Tooltip({
  children,
  ...props
}: ComponentProps<typeof TooltipPrimitive>) {
  const hasHover = useHasHoverSupport();
  const [open, setOpen] = useState(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  if (hasHover)
    return <TooltipPrimitive {...props}>{children}</TooltipPrimitive>;

  const reveal = () => {
    clearTimeout(dismissTimer.current);
    setOpen(true);
    dismissTimer.current = setTimeout(
      () => setOpen(false),
      TAP_TOOLTIP_VISIBLE_MS,
    );
  };

  return (
    <TapTooltipContext.Provider value={reveal}>
      {/* no onOpenChange on purpose, radix's own click handler closes it right
      after the tap opened it (so it just blinked lol), the timer owns open here */}
      <TooltipPrimitive {...props} {...{ open }}>
        {children}
      </TooltipPrimitive>
    </TapTooltipContext.Provider>
  );
}

export function TooltipTrigger(
  props: ComponentProps<typeof TooltipTriggerPrimitive>,
) {
  const reveal = useContext(TapTooltipContext);
  if (!reveal) return <TooltipTriggerPrimitive {...props} />;

  // capture phase so it runs before the trigger's own onClick (which still
  // fires normally), `contents` keeps this span out of flex/gap layout
  return (
    <span className="contents" onClickCapture={reveal}>
      <TooltipTriggerPrimitive {...props} />
    </span>
  );
}

export { TooltipContent, TooltipProvider } from "@/shadcn/ui/tooltip";
