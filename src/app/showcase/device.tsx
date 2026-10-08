"use client";

import {
  AppleIcon,
  Globe02Icon,
  SmartPhone01Icon,
  Tablet01Icon,
} from "@hugeicons/core-free-icons";
import { useState } from "react";
import { EyeDropperButton } from "@/components/device/EyeDropperButton";
import { FocusTimer } from "@/components/device/FocusTimer";
import { InstallSteps } from "@/components/device/InstallSteps";
import { PianoKeys } from "@/components/device/PianoKeys";
import { ShareButton } from "@/components/device/ShareButton";
import { TiltCard } from "@/components/device/TiltCard";
import type { ManualInstallPlatform } from "@/components/device/useInstallPrompt";
import { EmojiAnimation, FluentEmoji } from "@/components/FluentEmoji";
import { type SlidingTab, SlidingTabs } from "@/components/SlidingTabs";
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

const PLATFORM_TABS: SlidingTab<ManualInstallPlatform>[] = [
  { value: "iphone", label: "iPhone", icon: SmartPhone01Icon },
  { value: "ipad", label: "iPad", icon: Tablet01Icon },
  { value: "iosBrowser", label: "Other", icon: Globe02Icon },
  { value: "mac", label: "Mac", icon: AppleIcon },
];

function InstallStepsDemo() {
  const [platform, setPlatform] = useState<ManualInstallPlatform>("iphone");
  return (
    <div className="flex flex-col gap-4">
      <SlidingTabs
        tabs={PLATFORM_TABS}
        value={platform}
        onValueChange={setPlatform}
      />
      <InstallSteps {...{ platform }} />
    </div>
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
    name: "InstallSteps",
    path: "src/components/device/InstallSteps.tsx",
    wide: true,
    description:
      "safari has no install prompt, so the menu's install row unfolds these on iphone, ipad, other ios browsers and mac safari (useInstallPrompt picks which, and hides it once running as the installed app). chrome and edge get their real install popup instead",
    Demo: InstallStepsDemo,
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
