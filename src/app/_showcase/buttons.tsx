"use client";

import {
  Delete02Icon,
  PencilEdit02Icon,
  Rocket01Icon,
  Settings02Icon,
  Tag01Icon,
  Tick02Icon,
  UserRemove01Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { useState } from "react";
import { Chip } from "@/components/Chip";
import { ConfirmButton } from "@/components/ConfirmButton";
import { SubmitButton } from "@/components/form/SubmitButton";
import { MiniButton, MiniButtonTone } from "@/components/MiniButton";
import { toggleListItem } from "@/utils/array";
import { getColorForKey, getColorStyle } from "@/utils/color";
import type { ShowcaseItem } from "./ShowcaseCard";
import { wait } from "./util";

const MINI_BUTTON_TONES: {
  tone: MiniButtonTone;
  label: string;
  icon: IconSvgElement;
}[] = [
  { tone: MiniButtonTone.Neutral, label: "Settings", icon: Settings02Icon },
  { tone: MiniButtonTone.View, label: "View", icon: ViewIcon },
  { tone: MiniButtonTone.Edit, label: "Edit", icon: PencilEdit02Icon },
  { tone: MiniButtonTone.Confirm, label: "Confirm", icon: Tick02Icon },
  { tone: MiniButtonTone.Destructive, label: "Delete", icon: Delete02Icon },
];

const CHIP_LABELS = ["design", "backend", "urgent", "bug", "idea"];

function ChipDemo() {
  const [picked, setPicked] = useState<string[]>(["design"]);
  const toggle = (label: string) => setPicked(toggleListItem(picked, label));

  return CHIP_LABELS.map((label) => (
    <Chip
      key={label}
      icon={Tag01Icon}
      {...{ label }}
      onClick={() => toggle(label)}
      style={
        picked.includes(label)
          ? getColorStyle(getColorForKey(label))
          : undefined
      }
      className={
        picked.includes(label) ? undefined : "bg-muted text-muted-foreground"
      }
    />
  ));
}

function SubmitButtonDemo() {
  const [pending, setPending] = useState(false);
  const fakeSubmit = async () => {
    setPending(true);
    await wait(1500);
    setPending(false);
  };

  return (
    <SubmitButton icon={Rocket01Icon} {...{ pending }} onClick={fakeSubmit}>
      {pending ? "Launching..." : "Launch"}
    </SubmitButton>
  );
}

export const BUTTON_ITEMS: ShowcaseItem[] = [
  {
    name: "MiniButton",
    path: "src/components/MiniButton.tsx",
    description:
      "icon-only row action, tone picks the tint. hover for the tooltip",
    Demo: () =>
      MINI_BUTTON_TONES.map(({ tone, label, icon }) => (
        <MiniButton key={tone} {...{ tone, label, icon }} />
      )),
  },
  {
    name: "ConfirmButton",
    path: "src/components/ConfirmButton.tsx",
    description:
      "arm, then wait out a countdown before confirm unlocks. second one also wants typed text",
    Demo: () => (
      <>
        <ConfirmButton
          icon={Delete02Icon}
          label="Delete item"
          confirmLabel="Delete"
          holdSeconds={3}
          tone={MiniButtonTone.Destructive}
          onConfirm={() => wait(800)}
        />
        <ConfirmButton
          icon={UserRemove01Icon}
          label="Delete account"
          confirmLabel="Delete forever"
          holdSeconds={2}
          confirmText="delete me"
          onConfirm={() => wait(800)}
        />
      </>
    ),
  },
  {
    name: "Chip",
    path: "src/components/Chip.tsx",
    description:
      "toggle pill, color comes from the caller (here getColorForKey hashes the label)",
    Demo: ChipDemo,
  },
  {
    name: "SubmitButton",
    path: "src/components/form/SubmitButton.tsx",
    description: "icon turns into a spinner while pending",
    Demo: SubmitButtonDemo,
  },
];
