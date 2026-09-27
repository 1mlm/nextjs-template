"use client";

import {
  Alert02Icon,
  CancelCircleIcon,
  CheckIcon,
  CheckmarkCircle02Icon,
  Copy01Icon,
  Delete02Icon,
  Dumbbell01Icon,
  FeatherIcon,
  Notification01Icon,
  PartyIcon,
  Target03Icon,
  TouchInteraction01Icon,
  WeightScaleIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { useState } from "react";
import useSound from "use-sound";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
import { useCopyToClipboard } from "@/utils/clipboard";
import { triggerConfetti } from "@/utils/confetti";
import { triggerHaptic } from "@/utils/haptics";
import { Chime, playChime } from "@/utils/sound";
import { runUndoableAction } from "@/utils/undoableAction";
import type { ShowcaseItem } from "./ShowcaseCard";

const HAPTIC_PRESETS: { preset: string; icon: IconSvgElement }[] = [
  { preset: "selection", icon: TouchInteraction01Icon },
  { preset: "light", icon: FeatherIcon },
  { preset: "medium", icon: Dumbbell01Icon },
  { preset: "heavy", icon: WeightScaleIcon },
  { preset: "success", icon: CheckmarkCircle02Icon },
  { preset: "warning", icon: Alert02Icon },
  { preset: "error", icon: CancelCircleIcon },
  { preset: "nudge", icon: Notification01Icon },
];

const CHIME_ICONS: Record<Chime, IconSvgElement> = {
  [Chime.Success]: CheckmarkCircle02Icon,
  [Chime.Error]: CancelCircleIcon,
};

function SoundCounterDemo() {
  const [play] = useSound("/sfx/main.mp3");
  const [count, setCount] = useState(0);

  return (
    <Button
      variant="outline"
      onClick={() => {
        setCount(count + 1);
        play();
      }}
    >
      <Icon icon={Target03Icon} /> +1 ({count})
    </Button>
  );
}

function UndoableDeleteDemo() {
  const [deleted, setDeleted] = useState(false);

  return (
    <Button
      variant="destructive"
      disabled={deleted}
      onClick={() => {
        setDeleted(true);
        runUndoableAction({
          message: "Invoice deleted",
          // nothing real to delete, so the demo just rearms once it "committed"
          commit: async () => {
            setDeleted(false);
            return undefined;
          },
          onRevert: () => setDeleted(false),
        });
      }}
    >
      <Icon icon={Delete02Icon} />
      {deleted ? "Deleted (undo in the toast)" : "Delete invoice"}
    </Button>
  );
}

function CopyDemo() {
  const { copied, copy } = useCopyToClipboard();

  return (
    <Button
      variant="outline"
      className="cursor-copy"
      onClick={() => copy("hello from the template")}
    >
      <Icon icon={copied ? CheckIcon : Copy01Icon} />
      {copied ? "Copied" : "Copy some text"}
    </Button>
  );
}

export const FEEL_ITEMS: ShowcaseItem[] = [
  {
    name: "triggerHaptic",
    path: "src/utils/haptics.ts",
    description:
      "web-haptics presets, open this on your phone (does nothing on desktop)",
    Demo: () =>
      HAPTIC_PRESETS.map(({ preset, icon }) => (
        <Button
          key={preset}
          size="sm"
          variant="outline"
          onClick={() => triggerHaptic(preset)}
        >
          <Icon {...{ icon }} />
          {preset}
        </Button>
      )),
  },
  {
    name: "playChime",
    path: "src/utils/sound.ts",
    description: "synthesized with the web audio api, no audio file",
    Demo: () =>
      Object.values(Chime).map((type) => (
        <Button key={type} variant="outline" onClick={() => playChime(type)}>
          <Icon icon={CHIME_ICONS[type]} />
          {type}
        </Button>
      )),
  },
  {
    name: "use-sound",
    path: "public/sfx/main.mp3",
    description: "file-based sound effect via the use-sound package",
    Demo: SoundCounterDemo,
  },
  {
    name: "triggerConfetti",
    path: "src/utils/confetti.ts",
    description: "canvas-confetti burst, skipped for reduced motion",
    Demo: () => (
      <Button onClick={triggerConfetti} className="cursor-party">
        <Icon icon={PartyIcon} />
        Celebrate
      </Button>
    ),
  },
  {
    name: "runUndoableAction",
    path: "src/utils/undoableAction.ts",
    description:
      "the one place toasts are used: defer the real mutation behind an undo window",
    Demo: UndoableDeleteDemo,
  },
  {
    name: "copyToClipboard",
    path: "src/utils/clipboard.ts",
    description:
      "falls back to execCommand on http, only says copied when it worked",
    Demo: CopyDemo,
  },
];
