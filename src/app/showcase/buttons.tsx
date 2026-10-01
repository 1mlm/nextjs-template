"use client";

import {
  Archive02Icon,
  GridViewIcon,
  LeftToRightListBulletIcon,
  Rocket01Icon,
  UserRemove01Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { useState } from "react";
import { Chip } from "@/components/Chip";
import { ConfirmButton } from "@/components/ConfirmButton";
import { SubmitButton } from "@/components/form/SubmitButton";
import { HoldButton } from "@/components/HoldButton";
import { MiniButton, MiniButtonTone } from "@/components/MiniButton";
import { type SlidingTab, SlidingTabs } from "@/components/SlidingTabs";
import { toggleListItem } from "@/utils/array";
import { getColorForKey, getColorStyle } from "@/utils/color";
import { APP_ICONS } from "@/utils/icons";
import type { ShowcaseItem } from "./ShowcaseCard";
import { wait } from "./util";

enum ViewMode {
  Grid = "grid",
  List = "list",
  Calendar = "calendar",
}

const VIEW_TABS: SlidingTab<ViewMode>[] = [
  { value: ViewMode.Grid, label: "Grid", icon: GridViewIcon },
  { value: ViewMode.List, label: "List", icon: LeftToRightListBulletIcon },
  { value: ViewMode.Calendar, label: "Calendar", icon: APP_ICONS.calendar },
];

function SlidingTabsDemo() {
  const [view, setView] = useState(ViewMode.Grid);
  return <SlidingTabs tabs={VIEW_TABS} value={view} onValueChange={setView} />;
}

function HoldButtonDemo() {
  const [archivedCount, setArchivedCount] = useState(0);
  return (
    <div className="flex flex-col items-center gap-2">
      <HoldButton
        variant="outline"
        icon={Archive02Icon}
        onConfirm={() => setArchivedCount(archivedCount + 1)}
      >
        Hold to archive
      </HoldButton>
      <span className="text-xs text-muted-foreground tabular-nums">
        archived {archivedCount} {archivedCount === 1 ? "time" : "times"}
      </span>
    </div>
  );
}

const MINI_BUTTON_TONES: {
  tone: MiniButtonTone;
  label: string;
  icon: IconSvgElement;
}[] = [
  { tone: MiniButtonTone.Neutral, label: "Settings", icon: APP_ICONS.settings },
  { tone: MiniButtonTone.Neutral, label: "View", icon: APP_ICONS.expand },
  { tone: MiniButtonTone.Edit, label: "Edit", icon: APP_ICONS.edit },
  { tone: MiniButtonTone.Confirm, label: "Confirm", icon: APP_ICONS.confirm },
  { tone: MiniButtonTone.Destructive, label: "Delete", icon: APP_ICONS.remove },
];

const CHIP_LABELS = ["design", "backend", "urgent", "bug", "idea"];

function ChipDemo() {
  const [picked, setPicked] = useState<string[]>(["design"]);
  const toggle = (label: string) => setPicked(toggleListItem(picked, label));

  return CHIP_LABELS.map((label) => (
    <Chip
      key={label}
      icon={APP_ICONS.tag}
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
        <MiniButton key={label} {...{ tone, label, icon }} />
      )),
  },
  {
    name: "ConfirmButton",
    path: "src/components/ConfirmButton.tsx",
    description:
      "opens a popover where confirm unlocks after a countdown, nothing around it shifts. second one also wants typed text",
    Demo: () => (
      <>
        <ConfirmButton
          icon={APP_ICONS.remove}
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
          tone={MiniButtonTone.Destructive}
          confirmText="delete me"
          onConfirm={() => wait(800)}
        />
      </>
    ),
  },
  {
    name: "HoldButton",
    path: "src/components/HoldButton.tsx",
    description:
      "press and hold to confirm, letting go early cancels. haptic + chime when it lands",
    Demo: HoldButtonDemo,
  },
  {
    name: "SlidingTabs",
    path: "src/components/SlidingTabs.tsx",
    description: "the active pill springs over to the tab you pick",
    Demo: SlidingTabsDemo,
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
