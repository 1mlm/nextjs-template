"use client";

import { Tick02Icon } from "@hugeicons/core-free-icons";
import { useEffect, useRef, useState } from "react";
import { CoordinatePlane, type PlanePoint } from "@/components/CoordinatePlane";
import { Icon } from "@/components/Icon";
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
];
