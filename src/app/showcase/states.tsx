"use client";

import {
  CheckmarkCircle02Icon,
  File02Icon,
  InboxIcon,
  Tag01Icon,
} from "@hugeicons/core-free-icons";
import { useState } from "react";
import { EmptyState, EmptyStateVariant } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Icon } from "@/components/Icon";
import { Kbd } from "@/components/Kbd";
import { LabelTag } from "@/components/LabelTag";
import { MarqueeText } from "@/components/MarqueeText";
import {
  CardGridSkeleton,
  ListRowSkeleton,
  TableBlockSkeleton,
} from "@/components/PageSkeleton";
import { ReorderList } from "@/components/ReorderList";
import { AlignedNumber } from "@/components/table/AlignedNumber";
import { CornerCountBadge } from "@/components/table/CornerCountBadge";
import { EnumBadge } from "@/components/table/CustomTableCell";
import type { ShowcaseItem } from "./ShowcaseCard";

const PRIORITIES = [
  { id: "ship", label: "Ship the onboarding flow", emoji: "🚀" },
  { id: "bugs", label: "Fix the login bugs", emoji: "🐛" },
  { id: "docs", label: "Write the API docs", emoji: "📚" },
  { id: "coffee", label: "Get coffee", emoji: "☕" },
];

function ReorderListDemo() {
  const [priorities, setPriorities] = useState(PRIORITIES);
  return (
    <ReorderList
      items={priorities}
      getItemId={(priority) => priority.id}
      onReorder={setPriorities}
      className="w-full"
      renderItem={({ label, emoji }, index) => (
        <span className="flex items-center gap-2 text-sm">
          <span className="w-4 text-center tabular-nums text-muted-foreground">
            {index + 1}
          </span>
          <span>{emoji}</span>
          <span className="truncate">{label}</span>
        </span>
      )}
    />
  );
}

const ALIGNED_NUMBERS = [1.2, 3.4567, 120, 0.05];

const LONG_FILE_NAMES = [
  "Q3 report final FINAL (2) actually final.pdf",
  "notes.txt",
  "screenshot 2026-09-26 at 14.32.11 from the meeting.png",
];

export const STATE_ITEMS: ShowcaseItem[] = [
  {
    name: "EmptyState",
    path: "src/components/EmptyState.tsx",
    description: "page variant with an icon, compact variant for tight spots",
    Demo: () => (
      <div className="flex w-full flex-col gap-2">
        <EmptyState
          icon={InboxIcon}
          message="No messages yet"
          className="p-4"
        />
        <EmptyState
          variant={EmptyStateVariant.Compact}
          message="nothing here (compact)"
        />
      </div>
    ),
  },
  {
    name: "ErrorState",
    path: "src/components/ErrorState.tsx",
    description:
      "friendly error block, logs the raw message instead of showing it",
    Demo: () => <ErrorState />,
  },
  {
    name: "ListRowSkeleton",
    path: "src/components/PageSkeleton.tsx",
    description: "loading placeholder for a feed / list",
    Demo: () => (
      <div className="w-full">
        <ListRowSkeleton count={3} />
      </div>
    ),
  },
  {
    name: "CardGridSkeleton",
    path: "src/components/PageSkeleton.tsx",
    description:
      "grid of card placeholders, for a page-level suspense fallback",
    Demo: () => (
      <div className="w-full">
        <CardGridSkeleton count={2} />
      </div>
    ),
  },
  {
    name: "TableBlockSkeleton",
    path: "src/components/PageSkeleton.tsx",
    description:
      "table-shaped placeholder for when CustomTable isn't mounted yet",
    Demo: () => (
      <div className="w-full">
        <TableBlockSkeleton rows={3} />
      </div>
    ),
  },
  {
    name: "ReorderList",
    path: "src/components/ReorderList.tsx",
    description:
      "drag the handle to rearrange, rows spring out of the way. focus a handle and use up/down on a keyboard",
    Demo: ReorderListDemo,
  },
  {
    name: "Kbd",
    path: "src/components/Kbd.tsx",
    description:
      "shortcut chips, mod is ⌘ on macs and Ctrl elsewhere, hidden on touch. press mod+k for the command palette",
    Demo: () => (
      <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          search anything <Kbd keys={["mod", "k"]} />
        </span>
        <span className="flex items-center gap-2">
          toggle the sidebar <Kbd keys={["mod", "b"]} />
        </span>
      </div>
    ),
  },
  {
    name: "MarqueeText",
    path: "src/components/MarqueeText.tsx",
    description:
      "too long for its spot? fades at the edge, hover it to read the rest (slides on its own on phones)",
    Demo: () => (
      <ul className="flex w-52 flex-col gap-1">
        {LONG_FILE_NAMES.map((fileName) => (
          <li
            key={fileName}
            className="flex items-center gap-2 rounded-lg bg-muted px-2.5 py-1.5 text-sm corner-squircle"
          >
            <Icon
              icon={File02Icon}
              className="shrink-0 text-muted-foreground"
            />
            <MarqueeText text={fileName} />
          </li>
        ))}
      </ul>
    ),
  },
  {
    name: "LabelTag",
    path: "src/components/LabelTag.tsx",
    description: "names a thing inside a sentence",
    Demo: () => (
      <p className="text-sm">
        attached to <LabelTag icon={File02Icon} label="Q3 report.pdf" /> by you
      </p>
    ),
  },
  {
    name: "EnumBadge",
    path: "src/components/table/CustomTableCell.tsx",
    description: "the colored status badge tables render",
    Demo: () => (
      <>
        <EnumBadge
          value={{
            label: "Active",
            icon: CheckmarkCircle02Icon,
            color: "green",
          }}
        />
        <EnumBadge
          value={{ label: "founder", icon: Tag01Icon, color: "violet" }}
        />
      </>
    ),
  },
  {
    name: "AlignedNumber",
    path: "src/components/table/AlignedNumber.tsx",
    description:
      "decimal points line up, trailing zeros are there but invisible",
    Demo: () => (
      <div className="flex flex-col items-end">
        {ALIGNED_NUMBERS.map((value) => (
          <AlignedNumber key={value} {...{ value }} decimals={4} />
        ))}
      </div>
    ),
  },
  {
    name: "CornerCountBadge",
    path: "src/components/table/CornerCountBadge.tsx",
    description: "count pill pinned to a corner, needs a relative parent",
    Demo: () => (
      <div className="relative rounded-lg border px-4 py-3 text-sm">
        3 tags
        <CornerCountBadge>
          +2 <Icon icon={Tag01Icon} />
        </CornerCountBadge>
      </div>
    ),
  },
];
