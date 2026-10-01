"use client";

import { LockIcon } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { motion } from "motion/react";
import { useRef } from "react";
import { Icon } from "@/components/Icon";
import { SquircleRing } from "@/components/SquircleRing";
import { cn } from "@/shadcn/utils";
import { type Color, getColorSwatch } from "@/utils/color";
import { triggerHaptic } from "@/utils/haptics";
import { APP_ICONS } from "@/utils/icons";
import { shakeElement } from "@/utils/shake";

export type Lesson = {
  id: string;
  title: string;
  icon: IconSvgElement;
};

enum LessonStatus {
  Done = "done",
  Current = "current",
  Locked = "locked",
}

const ROW_HEIGHT = 144;
const NODE_LIFT = 6;
// how far the nodes swing left and right of the middle, in % of the width
const SWING = 26;
const PATH_WIDTH = 100;

const getStatus = (index: number, completedCount: number) => {
  if (index < completedCount) return LessonStatus.Done;
  return index === completedCount ? LessonStatus.Current : LessonStatus.Locked;
};

const getNodeCenter = (index: number) => ({
  x: PATH_WIDTH / 2 + Math.sin(index * 0.85) * SWING,
  y: index * ROW_HEIGHT + ROW_HEIGHT / 2 - 10,
});

// the road between two nodes, an s-curve that leaves and arrives vertically
const getSegmentPath = (from: number, to: number) => {
  const start = getNodeCenter(from);
  const end = getNodeCenter(to);
  const middleY = (start.y + end.y) / 2;
  return `M${start.x} ${start.y}C${start.x} ${middleY} ${end.x} ${middleY} ${end.x} ${end.y}`;
};

// the chunky pressable look: a solid edge underneath that the node sinks into
const getEdge = (face: string) => `color-mix(in oklab, ${face}, black 28%)`;

function LessonNode({
  lesson,
  status,
  color,
  progress,
  onSelect,
}: {
  lesson: Lesson;
  status: LessonStatus;
  color: Color;
  progress: number;
  onSelect: (lesson: Lesson) => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isLocked = status === LessonStatus.Locked;
  const isCurrent = status === LessonStatus.Current;
  const face = isLocked ? "var(--muted)" : getColorSwatch(color);
  const edge = isLocked ? "var(--border)" : getEdge(face);

  const handleClick = () => {
    if (!isLocked) return onSelect(lesson);
    triggerHaptic("warning");
    shakeElement(buttonRef.current);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        {isCurrent && (
          <>
            {/* the "go here" bubble bobbing over the node you're up to */}
            <span className="pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 animate-bounce [animation-duration:1.4s] motion-reduce:animate-none">
              <span
                style={{ color: face }}
                className="relative block rounded-xl border-2 bg-card px-3 py-1 text-xs font-bold tracking-wide"
              >
                START
                <span className="absolute -bottom-1.5 left-1/2 size-2.5 -translate-x-1/2 rotate-45 border-r-2 border-b-2 bg-card" />
              </span>
            </span>
            <SquircleRing
              {...{ progress }}
              inset={3}
              radius={34}
              strokeWidth={5}
              progressStroke={face}
              className="pointer-events-none absolute -inset-2 size-[calc(100%+1rem)] -rotate-90"
            />
          </>
        )}
        <motion.button
          ref={buttonRef}
          type="button"
          aria-label={`${lesson.title}, ${status}`}
          onClick={handleClick}
          initial={false}
          animate={{ y: 0, boxShadow: `0 ${NODE_LIFT}px 0 ${edge}` }}
          whileTap={{ y: NODE_LIFT, boxShadow: `0 0px 0 ${edge}` }}
          transition={{ type: "spring", stiffness: 700, damping: 30 }}
          style={{ background: face }}
          className={cn(
            "relative flex size-16 cursor-pointer items-center justify-center rounded-3xl text-white outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            isLocked && "text-muted-foreground",
          )}
        >
          <Icon icon={isLocked ? LockIcon : lesson.icon} className="size-7" />
          {status === LessonStatus.Done && (
            <span className="absolute -right-1.5 -bottom-1.5 flex size-6 items-center justify-center rounded-xl border-2 border-background bg-amber-400 text-white">
              <Icon
                icon={APP_ICONS.confirm}
                className="size-3.5"
                strokeWidth={3}
              />
            </span>
          )}
        </motion.button>
      </div>
      <span
        className={cn(
          "max-w-28 text-center text-xs font-medium",
          isLocked && "text-muted-foreground",
        )}
      >
        {lesson.title}
      </span>
    </div>
  );
}

// a winding road of lessons, the way learning apps lay out a course. the
// first `completedCount` are done, the next one is current (it bobs a START
// bubble and shows `currentProgress`, 0 to 1), the rest are locked and shake
// if you poke them. `onSelect` fires for the done and the current ones
export function LessonPath({
  lessons,
  completedCount,
  currentProgress = 0,
  color = "green",
  onSelect,
  className,
}: {
  lessons: Lesson[];
  completedCount: number;
  currentProgress?: number;
  color?: Color;
  onSelect: (lesson: Lesson) => void;
  className?: string;
}) {
  const segments = lessons.slice(1).map((lesson, index) => ({
    id: lesson.id,
    path: getSegmentPath(index, index + 1),
    isTravelled: index + 1 <= completedCount,
  }));

  return (
    <div
      style={{ height: lessons.length * ROW_HEIGHT + 24 }}
      className={cn("relative mx-auto w-full max-w-xs", className)}
    >
      <svg
        viewBox={`0 0 ${PATH_WIDTH} ${lessons.length * ROW_HEIGHT + 24}`}
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 size-full"
        aria-hidden
      >
        {segments.map(({ id, path, isTravelled }) => (
          <path
            key={id}
            d={path}
            fill="none"
            strokeWidth={10}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            strokeDasharray={isTravelled ? undefined : "0.1 14"}
            stroke={isTravelled ? getColorSwatch(color) : "var(--border)"}
            opacity={isTravelled ? 0.35 : 1}
          />
        ))}
      </svg>
      <div className="pop-items">
        {lessons.map((lesson, index) => {
          const { x, y } = getNodeCenter(index);
          return (
            <div
              key={lesson.id}
              style={{
                left: `${x}%`,
                top: y,
                transform: "translate(-50%, -50%)",
              }}
              className="absolute"
            >
              <LessonNode
                {...{ lesson, color, onSelect }}
                status={getStatus(index, completedCount)}
                progress={currentProgress}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
