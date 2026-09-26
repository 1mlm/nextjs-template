"use client";

import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { type ReactNode, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { cn } from "@/shadcn/utils";
import { useResizeObserver } from "@/utils/useResizeObserver";

const FADE_PX = 40;
// how much of the visible width one arrow tap scrolls
const ARROW_SCROLL_RATIO = 0.7;

enum ScrollSide {
  Left = "left",
  Right = "right",
}

const getEdgeMask = (canScrollLeft: boolean, canScrollRight: boolean) => {
  const left = canScrollLeft ? `transparent, black ${FADE_PX}px` : "black";
  const right = canScrollRight
    ? `black calc(100% - ${FADE_PX}px), transparent`
    : "black";
  return `linear-gradient(to right, ${left}, ${right})`;
};

// a single row that scrolls sideways when it doesn't fit, instead of wrapping
// into a tall block. whichever side has more hidden stuff fades out and gets
// a little arrow, so it's obvious you can swipe (or click) that way
export function ScrollRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState({ left: false, right: false });

  const measureScrollEdges = () => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
    setCanScroll({
      left: scroller.scrollLeft > 1,
      right: scroller.scrollLeft < maxScrollLeft - 1,
    });
  };
  useResizeObserver([scrollerRef, contentRef], measureScrollEdges);

  const scrollToward = (side: ScrollSide) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const distance = scroller.clientWidth * ARROW_SCROLL_RATIO;
    scroller.scrollBy({
      left: side === ScrollSide.Left ? -distance : distance,
      behavior: "smooth",
    });
  };

  const edgeMask = getEdgeMask(canScroll.left, canScroll.right);
  const arrows = [
    { side: ScrollSide.Left, isVisible: canScroll.left, icon: ArrowLeft01Icon },
    {
      side: ScrollSide.Right,
      isVisible: canScroll.right,
      icon: ArrowRight01Icon,
    },
  ];

  return (
    <div className={cn("relative min-w-0", className)}>
      <div
        ref={scrollerRef}
        onScroll={measureScrollEdges}
        className="overflow-x-auto overscroll-x-contain [scrollbar-width:none]"
        style={{ maskImage: edgeMask, WebkitMaskImage: edgeMask }}
      >
        <div ref={contentRef} className="flex w-max items-center gap-2">
          {children}
        </div>
      </div>
      {arrows.map(({ side, isVisible, icon }) => (
        <button
          key={side}
          type="button"
          tabIndex={-1}
          aria-hidden
          onClick={() => scrollToward(side)}
          className={cn(
            "absolute top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-background text-foreground shadow-md ring-1 ring-border transition-opacity duration-200",
            side === ScrollSide.Left ? "left-0" : "right-0",
            isVisible ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <Icon {...{ icon }} className="size-3.5" />
        </button>
      ))}
    </div>
  );
}
