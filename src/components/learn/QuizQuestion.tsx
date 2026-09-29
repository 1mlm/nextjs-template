"use client";

import { Cancel01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { AnimatePresence, motion } from "motion/react";
import { type KeyboardEvent, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
import { cn } from "@/shadcn/utils";
import { triggerConfetti } from "@/utils/confetti";
import { triggerHaptic } from "@/utils/haptics";
import { shakeElement } from "@/utils/shake";
import { Chime, playChime } from "@/utils/sound";

enum OptionState {
  Idle = "idle",
  Selected = "selected",
  Correct = "correct",
  Wrong = "wrong",
}

// chunky pressable cards: a solid lower edge that squashes when you press
const OPTION_CLASSES: Record<OptionState, string> = {
  [OptionState.Idle]:
    "border-border bg-card [--edge:var(--border)] hover:bg-muted",
  [OptionState.Selected]:
    "border-foreground bg-muted [--edge:var(--foreground)]",
  [OptionState.Correct]:
    "border-green-500 bg-green-500/15 [--edge:var(--color-green-500)]",
  [OptionState.Wrong]:
    "border-rose-500 bg-rose-500/15 [--edge:var(--color-rose-500)]",
};

// after checking, the feedback bar slides up in the answer's color
const FEEDBACK = {
  correct: {
    title: "Nice work!",
    icon: Tick02Icon,
    barClass: "bg-green-500/15 text-green-600",
    chipClass: "bg-green-500",
  },
  wrong: {
    title: "Not quite",
    icon: Cancel01Icon,
    barClass: "bg-rose-500/15 text-rose-600",
    chipClass: "bg-rose-500",
  },
};

// a multiple choice question in the check-then-continue style. pick an
// option (or press 1 to 4), Check, and a bar slides up green or red with the
// right answer and a Continue. remount it with a new `key` for the next one
export function QuizQuestion({
  question,
  options,
  correctIndex,
  explanation,
  onContinue,
  className,
}: {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  onContinue: (wasCorrect: boolean) => void;
  className?: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number>();
  const [wasChecked, setWasChecked] = useState(false);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const isCorrect = selectedIndex === correctIndex;

  const getOptionState = (index: number) => {
    if (!wasChecked)
      return index === selectedIndex ? OptionState.Selected : OptionState.Idle;
    if (index === correctIndex) return OptionState.Correct;
    return index === selectedIndex ? OptionState.Wrong : OptionState.Idle;
  };

  const select = (index: number) => {
    if (wasChecked) return;
    triggerHaptic("selection");
    setSelectedIndex(index);
  };

  const check = () => {
    setWasChecked(true);
    if (isCorrect) {
      triggerHaptic("success");
      playChime(Chime.Success);
      triggerConfetti();
      return;
    }
    triggerHaptic("error");
    playChime(Chime.Error);
    shakeElement(optionRefs.current[selectedIndex ?? 0]);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const index = Number(event.key) - 1;
    if (index >= 0 && index < options.length) select(index);
  };

  const feedback = isCorrect ? FEEDBACK.correct : FEEDBACK.wrong;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: it only listens for the 1 to 4 shortcuts bubbling up from the option buttons inside
    <div
      onKeyDown={handleKeyDown}
      className={cn(
        "flex w-full max-w-sm flex-col overflow-hidden rounded-3xl border bg-card",
        className,
      )}
    >
      <div className="flex flex-col gap-4 p-4">
        <h3 className="text-base font-semibold">{question}</h3>
        <div className="flex flex-col gap-2.5">
          {options.map((option, index) => (
            <button
              key={option}
              ref={(element) => {
                optionRefs.current[index] = element;
              }}
              type="button"
              disabled={wasChecked}
              onClick={() => select(index)}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-2xl border-2 px-3 py-2.5 text-left text-sm font-medium shadow-[0_4px_0_0_var(--edge)] transition-[translate,box-shadow,background-color,border-color] outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-1 active:shadow-none disabled:cursor-default",
                OPTION_CLASSES[getOptionState(index)],
              )}
            >
              <kbd className="flex size-6 shrink-0 items-center justify-center rounded-lg border text-xs text-muted-foreground">
                {index + 1}
              </kbd>
              {option}
            </button>
          ))}
        </div>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        {wasChecked ? (
          <motion.div
            key="feedback"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className={cn("flex flex-col gap-3 p-4", feedback.barClass)}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl text-white",
                  feedback.chipClass,
                )}
              >
                <Icon icon={feedback.icon} strokeWidth={3} className="size-5" />
              </span>
              <div className="flex flex-col">
                <span className="font-bold">{feedback.title}</span>
                <span className="text-sm text-foreground/80">
                  {isCorrect
                    ? explanation
                    : `Answer: ${options[correctIndex]}${explanation ? `. ${explanation}` : ""}`}
                </span>
              </div>
            </div>
            <Button size="lg" onClick={() => onContinue(isCorrect)}>
              Continue
            </Button>
          </motion.div>
        ) : (
          <motion.div key="check" exit={{ opacity: 0 }} className="p-4 pt-0">
            <Button
              size="lg"
              className="w-full"
              disabled={selectedIndex === undefined}
              onClick={check}
            >
              Check
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
