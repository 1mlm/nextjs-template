"use client";

import {
  Book01Icon,
  CubeIcon,
  PuzzleIcon,
  RocketIcon,
  Target01Icon,
  Tick02Icon,
  TrophyIcon,
} from "@hugeicons/core-free-icons";
import { useEffect, useRef, useState } from "react";
import { CoordinatePlane, type PlanePoint } from "@/components/CoordinatePlane";
import { Die3D } from "@/components/Die3D";
import { Icon } from "@/components/Icon";
import { type Lesson, LessonPath } from "@/components/LessonPath";
import { VoiceButton } from "@/components/VoiceButton";
import { Button } from "@/shadcn/ui/button";
import { triggerConfetti } from "@/utils/confetti";
import { shakeElement } from "@/utils/shake";
import { Chime, playChime } from "@/utils/sound";
import type { ShowcaseItem } from "./ShowcaseCard";

function VoiceButtonDemo() {
  const [recordingUrl, setRecordingUrl] = useState<string>();

  // a new recording replaces the old one, its blob url is freed with it
  useEffect(
    () => () => {
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    },
    [recordingUrl],
  );

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <VoiceButton
        onRecorded={(recording) =>
          setRecordingUrl(URL.createObjectURL(recording))
        }
      />
      {recordingUrl && (
        // biome-ignore lint/a11y/useMediaCaption: it plays back whatever you just said, there's no transcript to caption
        <audio controls src={recordingUrl} className="h-9 w-full max-w-xs" />
      )}
    </div>
  );
}

const PLANE_START: PlanePoint = { x: 0, y: 0, label: "A", color: "violet" };
const PLANE_TARGETS: PlanePoint[] = [
  { x: 3, y: -2 },
  { x: -4, y: 1 },
  { x: 2, y: 4 },
  { x: -3, y: -3 },
];

function CoordinatePlaneDemo() {
  const [point, setPoint] = useState(PLANE_START);
  const [round, setRound] = useState(0);
  const [isSolved, setIsSolved] = useState(false);
  const planeRef = useRef<HTMLDivElement>(null);
  const target = PLANE_TARGETS[round % PLANE_TARGETS.length];

  const check = () => {
    const isCorrect = point.x === target.x && point.y === target.y;
    if (!isCorrect) {
      shakeElement(planeRef.current);
      playChime(Chime.Error);
      return;
    }
    setIsSolved(true);
    playChime(Chime.Success);
    triggerConfetti();
  };

  const nextRound = () => {
    setRound(round + 1);
    setIsSolved(false);
    setPoint(PLANE_START);
  };

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <p className="text-sm">
        drag A to{" "}
        <span className="font-mono font-semibold">
          ({target.x}, {target.y})
        </span>
      </p>
      <div ref={planeRef} className="flex w-full justify-center">
        <CoordinatePlane
          points={[point]}
          onChange={([moved]) => setPoint(moved)}
          targets={isSolved ? [target] : []}
        />
      </div>
      {isSolved ? (
        <Button onClick={nextRound}>
          <Icon icon={Tick02Icon} /> Next point
        </Button>
      ) : (
        <Button onClick={check}>Check</Button>
      )}
    </div>
  );
}

const LESSONS: Lesson[] = [
  { id: "intro", title: "Hello, numbers", icon: Book01Icon },
  { id: "axes", title: "The two axes", icon: Target01Icon },
  { id: "points", title: "Plotting points", icon: PuzzleIcon },
  { id: "shapes", title: "Shapes on a grid", icon: CubeIcon },
  { id: "launch", title: "Blast off", icon: RocketIcon },
  { id: "boss", title: "Final boss", icon: TrophyIcon },
];

function LessonPathDemo() {
  const [completedCount, setCompletedCount] = useState(2);

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <LessonPath
        lessons={LESSONS}
        {...{ completedCount }}
        currentProgress={0.4}
        onSelect={(lesson) => {
          if (LESSONS.indexOf(lesson) !== completedCount) return;
          triggerConfetti();
          playChime(Chime.Success);
          setCompletedCount(completedCount + 1);
        }}
      />
      <Button variant="outline" size="sm" onClick={() => setCompletedCount(0)}>
        Start over
      </Button>
    </div>
  );
}

function Die3DDemo() {
  return (
    <div className="w-full text-sm leading-relaxed">
      <Die3D className="float-right mb-1 ml-3 size-36 [shape-outside:circle(50%)]" />
      roll a fair die and every face has the same chance, one in six. that makes
      it the friendliest way to teach probability: nobody has to trust a formula
      when they can just throw it a hundred times and watch the counts even out.
      drag it to spin it, it coasts to a stop, and a tap throws it. the canvas
      has no background at all, so the text hugs the die like it was drawn into
      the paragraph.
    </div>
  );
}

export const LEARN_ITEMS: ShowcaseItem[] = [
  {
    name: "VoiceButton",
    path: "src/components/VoiceButton.tsx",
    description:
      "hold to talk or tap to keep listening. the rings ripple with your real voice (microphone level), the recording comes back through onRecorded",
    Demo: VoiceButtonDemo,
  },
  {
    name: "CoordinatePlane",
    path: "src/components/CoordinatePlane.tsx",
    description:
      "a graph with draggable points that snap to whole numbers with a spring, dashed guides to the axes, arrow keys work too. targets are ghost cells that light up green when a point lands on one",
    Demo: CoordinatePlaneDemo,
  },
  {
    name: "LessonPath",
    path: "src/components/LessonPath.tsx",
    description:
      "a winding road of lessons: done ones are colored, the current one bobs a START bubble with a progress ring, locked ones shake when poked. the nodes sink into their edge when pressed. tap the current one to finish it",
    Demo: LessonPathDemo,
  },
  {
    name: "Die3D",
    path: "src/components/Die3D.tsx",
    description:
      "a real 3D die (three.js) with a transparent canvas, so it sits inside the text and the paragraph wraps around it. drag to spin with inertia, tap to throw. three only downloads when it is scrolled near, and it stops drawing off screen",
    wide: true,
    Demo: Die3DDemo,
  },
];
