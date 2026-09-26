"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";

type MarqueeVariables = CSSProperties & Record<`--${string}`, string>;

import { cn } from "@/shadcn/utils";

// how fast the text slides, slow enough to actually read it
const PIXELS_PER_SECOND = 40;
const MIN_DURATION_SECONDS = 2;

// text that doesn't fit fades out at the edge instead of an ellipsis, and
// slides back and forth to show the rest while hovered. no hover on phones,
// so there it just keeps sliding slowly on its own
export function MarqueeText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflowPx, setOverflowPx] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    const textElement = textRef.current;
    if (!container || !textElement) return;
    const measure = () =>
      setOverflowPx(
        Math.max(0, textElement.scrollWidth - container.clientWidth),
      );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    observer.observe(textElement);
    return () => observer.disconnect();
  }, []);

  const isOverflowing = overflowPx > 1;
  const marqueeStyle: MarqueeVariables = {
    "--marquee-distance": `${overflowPx}px`,
  };
  const slideDuration = `${Math.max(MIN_DURATION_SECONDS, overflowPx / PIXELS_PER_SECOND)}s`;

  return (
    <span
      ref={containerRef}
      title={isOverflowing ? text : undefined}
      style={marqueeStyle}
      className={cn(
        "group/marquee block min-w-0 overflow-hidden whitespace-nowrap",
        isOverflowing &&
          "mask-[linear-gradient(to_right,black_85%,transparent)] hover:mask-none pointer-coarse:mask-none",
        className,
      )}
    >
      <span
        ref={textRef}
        style={{ animationDuration: slideDuration }}
        className={cn(
          "inline-block",
          isOverflowing &&
            "motion-safe:group-hover/marquee:animate-marquee motion-safe:pointer-coarse:animate-marquee",
        )}
      >
        {text}
      </span>
    </span>
  );
}
