"use client";

import { motion } from "motion/react";
import { Fragment, useRef, useState } from "react";
import { Button } from "@/shadcn/ui/button";
import { cn } from "@/shadcn/utils";
import { triggerConfetti } from "@/utils/confetti";
import { triggerHaptic } from "@/utils/haptics";
import { shakeElement } from "@/utils/shake";
import { Chime, playChime } from "@/utils/sound";

const CHIP_CLASS =
  "cursor-pointer rounded-xl border-2 bg-card px-3 py-1 text-sm font-medium shadow-[0_3px_0_0_var(--border)] outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-0.5 active:shadow-none";

function WordChip({
  word,
  onClick,
  className,
}: {
  word: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <motion.button
      layoutId={word}
      type="button"
      {...{ onClick }}
      transition={{ type: "spring", stiffness: 500, damping: 34 }}
      className={cn(CHIP_CLASS, className)}
    >
      {word}
    </motion.button>
  );
}

// fill in the blanks from a bank of words. tap a word and it flies into the
// first empty blank, tap a placed word and it flies back. the `{}` in the
// template are the blanks, `answers` lists what goes in each in order, and
// `words` is the bank (add a few decoys)
export function WordBank({
  template,
  words,
  answers,
  className,
}: {
  template: string;
  words: string[];
  answers: string[];
  className?: string;
}) {
  const parts = template.split("{}");
  const [slots, setSlots] = useState<(string | undefined)[]>(
    answers.map(() => undefined),
  );
  const [wasCorrect, setWasCorrect] = useState<boolean>();
  const sentenceRef = useRef<HTMLParagraphElement>(null);
  const bankWords = words.filter((word) => !slots.includes(word));
  const isFull = slots.every(Boolean);

  const changeSlot = (slotIndex: number, word: string | undefined) => {
    setWasCorrect(undefined);
    setSlots(slots.map((slot, index) => (index === slotIndex ? word : slot)));
  };

  const place = (word: string) => {
    const firstEmpty = slots.indexOf(undefined);
    if (firstEmpty === -1) return;
    triggerHaptic("selection");
    changeSlot(firstEmpty, word);
  };

  const putBack = (slotIndex: number) => {
    triggerHaptic("light");
    changeSlot(slotIndex, undefined);
  };

  const check = () => {
    const isRight = slots.every((slot, index) => slot === answers[index]);
    setWasCorrect(isRight);
    if (isRight) {
      triggerHaptic("success");
      playChime(Chime.Success);
      triggerConfetti();
      return;
    }
    triggerHaptic("error");
    playChime(Chime.Error);
    shakeElement(sentenceRef.current);
  };

  return (
    <div
      className={cn(
        "flex w-full max-w-sm flex-col gap-5 rounded-3xl border bg-card p-4",
        className,
      )}
    >
      <p ref={sentenceRef} className="text-base leading-10">
        {parts.map((part, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: the sentence is fixed text, its parts never reorder
          <Fragment key={index}>
            {part}
            {index < slots.length && (
              <span
                className={cn(
                  "mx-1 inline-flex h-9 min-w-20 items-center justify-center rounded-xl border-2 border-dashed align-middle transition-colors",
                  wasCorrect === true && "border-green-500 bg-green-500/15",
                  wasCorrect === false && "border-rose-500 bg-rose-500/15",
                )}
              >
                {slots[index] && (
                  <WordChip
                    word={slots[index]}
                    onClick={() => putBack(index)}
                    className="border-solid"
                  />
                )}
              </span>
            )}
          </Fragment>
        ))}
      </p>
      <div className="flex min-h-12 flex-wrap justify-center gap-2 border-t pt-4">
        {bankWords.map((word) => (
          <WordChip key={word} {...{ word }} onClick={() => place(word)} />
        ))}
      </div>
      <Button
        size="lg"
        disabled={!isFull || wasCorrect === true}
        onClick={check}
      >
        Check
      </Button>
    </div>
  );
}
