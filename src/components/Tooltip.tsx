"use client";

import {
  type ComponentProps,
  createContext,
  type RefObject,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Tooltip as TooltipPrimitive,
  TooltipTrigger as TooltipTriggerPrimitive,
} from "@/shadcn/ui/tooltip";
import { triggerHaptic } from "@/utils/haptics";

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

const TapTooltipContext = createContext<{
  toggle: () => void;
  triggerRef: RefObject<HTMLSpanElement | null>;
} | null>(null);

// radix tooltips only open on hover/focus, and a tap on a phone gives you
// neither (the label never shows or flashes for like one frame, so annoyingggg).
// on touch devices a tap toggles it and a tap anywhere else closes it, mouse
// devices get plain radix behavior untouched
export function Tooltip({
  children,
  ...props
}: ComponentProps<typeof TooltipPrimitive>) {
  const hasHover = useHasHoverSupport();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);

  // any tap outside the trigger closes it, like a popover
  useEffect(() => {
    if (!open) return;
    const closeOnOutsideTap = (event: PointerEvent) => {
      const isInsideTrigger =
        event.target instanceof Node &&
        triggerRef.current?.contains(event.target);
      if (!isInsideTrigger) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideTap);
    return () => document.removeEventListener("pointerdown", closeOnOutsideTap);
  }, [open]);

  if (hasHover)
    return <TooltipPrimitive {...props}>{children}</TooltipPrimitive>;

  const toggle = () => {
    triggerHaptic("selection");
    setOpen((wasOpen) => !wasOpen);
  };

  return (
    <TapTooltipContext.Provider value={{ toggle, triggerRef }}>
      {/* no onOpenChange on purpose, radix's own click handler closes it right
      after the tap opened it (so it just blinked lol), this state owns open here */}
      <TooltipPrimitive {...props} {...{ open }}>
        {children}
      </TooltipPrimitive>
    </TapTooltipContext.Provider>
  );
}

export function TooltipTrigger(
  props: ComponentProps<typeof TooltipTriggerPrimitive>,
) {
  const tapTooltip = useContext(TapTooltipContext);
  if (!tapTooltip) return <TooltipTriggerPrimitive {...props} />;

  // capture phase so it runs before the trigger's own onClick (which still
  // fires normally), `contents` keeps this span out of flex/gap layout
  return (
    <span
      ref={tapTooltip.triggerRef}
      className="contents"
      onClickCapture={tapTooltip.toggle}
    >
      <TooltipTriggerPrimitive {...props} />
    </span>
  );
}

export { TooltipContent, TooltipProvider } from "@/shadcn/ui/tooltip";
