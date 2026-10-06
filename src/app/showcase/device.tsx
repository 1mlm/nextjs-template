"use client";

import { EyeDropperButton } from "@/components/device/EyeDropperButton";
import { FocusTimer } from "@/components/device/FocusTimer";
import { PianoKeys } from "@/components/device/PianoKeys";
import { ShareButton } from "@/components/device/ShareButton";
import { TiltCard } from "@/components/device/TiltCard";
import { EmojiAnimation, FluentEmoji } from "@/components/FluentEmoji";
import type { ShowcaseItem } from "./ShowcaseCard";

function TiltCardDemo() {
  return (
    <TiltCard className="flex items-center gap-4">
      <FluentEmoji
        emoji="trophy"
        animation={EmojiAnimation.Always}
        className="size-16"
      />
      <div className="flex flex-col">
        <span className="text-lg font-bold">Perfect week</span>
        <span className="text-sm text-muted-foreground">
          7 lessons, no hearts lost
        </span>
      </div>
    </TiltCard>
  );
}

export const DEVICE_ITEMS: ShowcaseItem[] = [
  {
    name: "TiltCard",
    path: "src/components/device/TiltCard.tsx",
    description:
      "a card that leans toward your cursor or finger with a glare following it. on android the gyroscope tilts it when you move the phone",
    Demo: TiltCardDemo,
  },
  {
    name: "PianoKeys",
    path: "src/components/device/PianoKeys.tsx",
    description:
      "a one octave piano, synthesized with the web audio api. click, tap, drag across the keys, or focus it and use a s d f g h j k (w e t y u for the black ones)",
    Demo: () => <PianoKeys />,
  },
  {
    name: "FocusTimer",
    path: "src/components/device/FocusTimer.tsx",
    description:
      "keeps the screen awake while it runs (wake lock) and pops out into a small always-on-top window with the document picture-in-picture api (chrome and edge). this one is a single minute so you can watch it finish",
    Demo: () => <FocusTimer minutes={1} />,
  },
  {
    name: "EyeDropperButton",
    path: "src/components/device/EyeDropperButton.tsx",
    description:
      "the native eyedropper: pick any color on your screen, even outside the browser. chrome and edge only, other browsers get a disabled button that says why",
    Demo: () => <EyeDropperButton />,
  },
  {
    name: "ShareButton",
    path: "src/components/device/ShareButton.tsx",
    description:
      "opens the system share sheet where the browser has one, copies the link everywhere else",
    Demo: () => (
      <ShareButton
        title="Malik Kit"
        text="a component kit with playful bits"
        url="https://github.com/1mlm/nextjs-template"
      />
    ),
  },
];
