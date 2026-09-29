"use client";

import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { EmojiAnimation, FluentEmoji } from "@/components/FluentEmoji";
import { cn } from "@/shadcn/utils";
import { triggerHaptic } from "@/utils/haptics";

// lives, the way a lesson counts your mistakes. a lost heart pops, wobbles
// and greys out, a refilled one bounces back
export function Hearts({
  hearts,
  max = 5,
  className,
}: {
  hearts: number;
  max?: number;
  className?: string;
}) {
  const previousHearts = useRef(hearts);

  useEffect(() => {
    if (hearts < previousHearts.current) triggerHaptic("warning");
    previousHearts.current = hearts;
  }, [hearts]);

  return (
    <div
      role="img"
      aria-label={`${hearts} of ${max} hearts left`}
      className={cn("flex gap-1", className)}
    >
      {Array.from({ length: max }, (_, index) => {
        const isFull = index < hearts;
        return (
          <motion.span
            // biome-ignore lint/suspicious/noArrayIndexKey: heart slots are positional, they never reorder
            key={index}
            initial={false}
            animate={
              isFull
                ? { scale: 1, rotate: 0 }
                : { scale: [1.3, 0.8, 0.88], rotate: [0, -14, 10, 0] }
            }
            transition={
              // keyframes can't run on a spring, so losing one is a timed pop
              isFull
                ? { type: "spring", stiffness: 420, damping: 12 }
                : { duration: 0.5, ease: "easeOut" }
            }
          >
            <FluentEmoji
              emoji="heart"
              animation={EmojiAnimation.Never}
              className={cn(
                "size-9 transition-[filter,opacity] duration-300",
                !isFull && "opacity-35 grayscale",
              )}
            />
          </motion.span>
        );
      })}
    </div>
  );
}
