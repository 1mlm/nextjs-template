"use client";

import NumberFlow from "@number-flow/react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/shadcn/utils";
import { triggerConfetti } from "@/utils/confetti";
import { triggerHaptic } from "@/utils/haptics";
import { Chime, playChime } from "@/utils/sound";

const GAIN_VISIBLE_MS = 1000;
const FILL_SPRING = { type: "spring", stiffness: 140, damping: 20 } as const;

// a level bar. pass the total xp and it works out the level and how full the
// bar is. gaining xp floats a "+10 XP" over it, crossing a level throws
// confetti and buzzes
export function XpBar({
  xp,
  xpPerLevel = 100,
  className,
}: {
  xp: number;
  xpPerLevel?: number;
  className?: string;
}) {
  const level = Math.floor(xp / xpPerLevel) + 1;
  const xpInLevel = xp % xpPerLevel;
  const previousXp = useRef(xp);
  const [gain, setGain] = useState<{ id: number; amount: number }>();
  const fill = useMotionValue(xpInLevel / xpPerLevel);
  const fillWidth = useTransform(fill, (value) => `${value * 100}%`);

  useEffect(() => {
    const amount = xp - previousXp.current;
    const didLevelUp =
      Math.floor(xp / xpPerLevel) > Math.floor(previousXp.current / xpPerLevel);
    previousXp.current = xp;
    const remainder = (xp % xpPerLevel) / xpPerLevel;
    // a level up fills the bar to the end first, then it starts over in the new level
    if (didLevelUp)
      animate(fill, 1, FILL_SPRING).then(() => {
        fill.jump(0);
        animate(fill, remainder, FILL_SPRING);
      });
    else animate(fill, remainder, FILL_SPRING);
    if (amount <= 0) return;
    setGain({ id: Date.now(), amount });
    if (!didLevelUp) return;
    triggerHaptic("success");
    playChime(Chime.Success);
    triggerConfetti();
  }, [xp, xpPerLevel, fill]);

  useEffect(() => {
    if (!gain) return;
    const timeout = setTimeout(() => setGain(undefined), GAIN_VISIBLE_MS);
    return () => clearTimeout(timeout);
  }, [gain]);

  return (
    <div
      className={cn("relative flex w-full max-w-xs flex-col gap-2", className)}
    >
      <div className="flex items-baseline justify-between text-sm">
        <span className="rounded-xl bg-amber-400 px-2.5 py-0.5 text-xs font-bold text-amber-950">
          LEVEL <NumberFlow value={level} />
        </span>
        <span className="text-muted-foreground tabular-nums">
          <NumberFlow value={xpInLevel} /> / {xpPerLevel} XP
        </span>
      </div>
      <div className="h-5 overflow-hidden rounded-2xl bg-muted">
        <motion.div
          style={{ width: fillWidth }}
          className="relative h-full rounded-2xl bg-amber-400"
        >
          <span className="absolute inset-x-2 top-1 h-1 rounded-full bg-white/40" />
        </motion.div>
      </div>
      <AnimatePresence>
        {gain && (
          <motion.span
            key={gain.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: -6 }}
            exit={{ opacity: 0, y: -22 }}
            className="pointer-events-none absolute right-0 -top-3 text-sm font-bold text-amber-500"
          >
            +{gain.amount} XP
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
