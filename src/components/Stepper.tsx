"use client";

import { Tick02Icon } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { Fragment } from "react";
import { Icon } from "@/components/Icon";
import { IconChip } from "@/components/IconChip";
import { cn } from "@/shadcn/utils";

export type StepperStep = {
  id: string;
  label: string;
  icon: IconSvgElement;
};

enum StepState {
  Done = "done",
  Current = "current",
  Upcoming = "upcoming",
}

const getStepState = (index: number, currentIndex: number) => {
  if (index < currentIndex) return StepState.Done;
  if (index === currentIndex) return StepState.Current;
  return StepState.Upcoming;
};

const STEP_CHIP_CLASS: Record<StepState, string> = {
  [StepState.Done]: "bg-foreground text-background",
  [StepState.Current]:
    "bg-foreground text-background ring-4 ring-foreground/15",
  [StepState.Upcoming]: "bg-muted text-muted-foreground",
};

// progress through a multi step flow. wide screens get the icon chain,
// phones get "step 2 of 4" over a segmented bar since a row of labels never
// fits. only finished steps are clickable, jumping ahead would skip checks.
// currentIndex === steps.length means the whole flow is done
export function Stepper({
  steps,
  currentIndex,
  onStepClick,
  className,
}: {
  steps: StepperStep[];
  currentIndex: number;
  onStepClick?: (index: number) => void;
  className?: string;
}) {
  const currentStep = steps[currentIndex];

  return (
    <div className={className}>
      <div className="flex flex-col gap-2 sm:hidden">
        <div className="flex items-center gap-2 text-sm">
          <Icon icon={currentStep?.icon ?? Tick02Icon} className="size-4" />
          <span className="truncate font-semibold">
            {currentStep?.label ?? "All done"}
          </span>
          <span className="ml-auto shrink-0 text-muted-foreground tabular-nums">
            {Math.min(currentIndex + 1, steps.length)} / {steps.length}
          </span>
        </div>
        <div className="flex gap-1">
          {steps.map((step, index) => (
            <span
              key={step.id}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors duration-300",
                index <= currentIndex ? "bg-foreground" : "bg-muted",
              )}
            />
          ))}
        </div>
      </div>

      <ol className="hidden items-center sm:flex">
        {steps.map((step, index) => {
          const state = getStepState(index, currentIndex);
          const isClickable = state === StepState.Done && Boolean(onStepClick);
          return (
            <Fragment key={step.id}>
              {index > 0 && (
                <span className="mx-2 h-0.5 min-w-4 flex-1 overflow-hidden rounded-full bg-muted">
                  <span
                    className={cn(
                      "block h-full origin-left bg-foreground transition-transform duration-500",
                      index <= currentIndex ? "scale-x-100" : "scale-x-0",
                    )}
                  />
                </span>
              )}
              <li>
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => onStepClick?.(index)}
                  aria-current={
                    state === StepState.Current ? "step" : undefined
                  }
                  className="group/step flex items-center gap-2 rounded-lg p-1 pr-2 enabled:cursor-pointer enabled:hover:bg-muted"
                >
                  <IconChip
                    icon={state === StepState.Done ? Tick02Icon : step.icon}
                    className={cn(
                      "transition-all duration-300",
                      STEP_CHIP_CLASS[state],
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm whitespace-nowrap transition-colors",
                      state === StepState.Current && "font-semibold",
                      state === StepState.Upcoming && "text-muted-foreground",
                    )}
                  >
                    {step.label}
                  </span>
                </button>
              </li>
            </Fragment>
          );
        })}
      </ol>
    </div>
  );
}
