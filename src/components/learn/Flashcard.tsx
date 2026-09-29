"use client";

import { Cancel01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { type ReactNode, useState } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
import { cn } from "@/shadcn/utils";
import { triggerHaptic } from "@/utils/haptics";

export enum SwipeDirection {
  Again = "again",
  Known = "known",
}

const THROW_DISTANCE = 520;
const SWIPE_THRESHOLD = 110;
const FLICK_SPEED = 600;
const FACE_CLASS =
  "absolute inset-0 flex items-center justify-center rounded-3xl border p-6 text-center text-lg font-semibold shadow-[0_6px_0_0_var(--border)] [backface-visibility:hidden]";

// a study card. tap it to flip (a real 3D turn), swipe it away to grade it:
// left means again, right means known. two buttons do the same for anyone who
// doesn't swipe. remount it with a new `key` for the next card
export function Flashcard({
  front,
  back,
  onGrade,
  className,
}: {
  front: ReactNode;
  back: ReactNode;
  onGrade: (direction: SwipeDirection) => void;
  className?: string;
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const againOpacity = useTransform(x, [-120, -30], [1, 0]);
  const knownOpacity = useTransform(x, [30, 120], [0, 1]);

  // the stamps that fade in as you drag toward a side
  const stamps = [
    {
      label: "AGAIN",
      opacity: againOpacity,
      className: "right-4 rotate-12 border-rose-500 text-rose-500",
    },
    {
      label: "GOT IT",
      opacity: knownOpacity,
      className: "left-4 -rotate-12 border-green-500 text-green-500",
    },
  ];

  const throwCard = (direction: SwipeDirection) => {
    const isKnown = direction === SwipeDirection.Known;
    triggerHaptic(isKnown ? "success" : "light");
    animate(x, isKnown ? THROW_DISTANCE : -THROW_DISTANCE, {
      duration: 0.28,
      ease: "easeIn",
    }).then(() => onGrade(direction));
  };

  return (
    <div
      className={cn(
        "flex w-full max-w-xs flex-col items-center gap-5",
        className,
      )}
    >
      <motion.div
        drag="x"
        dragSnapToOrigin
        dragElastic={0.7}
        style={{ x, rotate }}
        onDragEnd={(_, { offset, velocity }) => {
          const isFlick = Math.abs(velocity.x) > FLICK_SPEED;
          if (Math.abs(offset.x) < SWIPE_THRESHOLD && !isFlick) return;
          throwCard(offset.x > 0 ? SwipeDirection.Known : SwipeDirection.Again);
        }}
        onTap={() => setIsFlipped(!isFlipped)}
        className="relative aspect-[4/3] w-full cursor-grab touch-pan-y select-none active:cursor-grabbing [perspective:1000px]"
      >
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="relative size-full [transform-style:preserve-3d]"
        >
          <div className={cn(FACE_CLASS, "bg-card")}>{front}</div>
          <div
            className={cn(FACE_CLASS, "bg-muted [transform:rotateY(180deg)]")}
          >
            {back}
          </div>
        </motion.div>
        {stamps.map(({ label, opacity, className }) => (
          <motion.span
            key={label}
            style={{ opacity }}
            className={cn(
              "pointer-events-none absolute top-4 rounded-xl border-2 px-2 py-0.5 text-sm font-bold",
              className,
            )}
          >
            {label}
          </motion.span>
        ))}
      </motion.div>
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => throwCard(SwipeDirection.Again)}
        >
          <Icon icon={Cancel01Icon} /> Again
        </Button>
        <Button onClick={() => throwCard(SwipeDirection.Known)}>
          <Icon icon={Tick02Icon} /> Got it
        </Button>
      </div>
    </div>
  );
}
