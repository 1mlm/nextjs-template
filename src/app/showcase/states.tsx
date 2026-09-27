"use client";

import {
  Clock01Icon,
  File02Icon,
  InboxIcon,
  RefreshIcon,
  SourceCodeIcon,
  Tag01Icon,
  Tick02Icon,
  UnavailableIcon,
} from "@hugeicons/core-free-icons";
import { useState } from "react";
import { EmptyState, EmptyStateVariant } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Icon } from "@/components/Icon";
import { Kbd } from "@/components/Kbd";
import { LabelTag } from "@/components/LabelTag";
import { MarqueeText } from "@/components/MarqueeText";
import {
  CARD_GRID_CLASS,
  CARD_HEIGHT_CLASS,
  CardGridSkeleton,
  ListRow,
  ListRowSkeleton,
  TableBlockSkeleton,
} from "@/components/PageSkeleton";
import { ReorderList } from "@/components/ReorderList";
import { AlignedNumber } from "@/components/table/AlignedNumber";
import { CornerCountBadge } from "@/components/table/CornerCountBadge";
import { EnumBadge } from "@/components/table/CustomTableCell";
import type { CustomTableEnumValue } from "@/components/table/columns";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import { cn } from "@/shadcn/utils";
import type { ShowcaseItem } from "./ShowcaseCard";

function LabelTagDemo() {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  return (
    <p className="text-sm leading-7">
      you attached{" "}
      <LabelTag
        icon={File02Icon}
        label="Q3 report.pdf"
        onOpen={() => setIsPreviewOpen(true)}
      />{" "}
      from{" "}
      <LabelTag
        icon={SourceCodeIcon}
        label="README.md"
        href="https://github.com/1mlm/nextjs-template/blob/main/.github/README.md"
      />{" "}
      to <LabelTag icon={Tag01Icon} label="finance" />
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Q3 report.pdf</DialogTitle>
            <DialogDescription>
              a popup tag opens something in place instead of leaving the page
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </p>
  );
}

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

const FAKE_NAMES = [
  "Amina Benali",
  "Youssef Haddad",
  "Sofia Cherkaoui",
  "Karim Ziani",
  "Lina Otmani",
  "Omar Fassi",
];
const FAKE_STATUSES: CustomTableEnumValue[] = [
  { label: "Active", icon: Tick02Icon, color: "green" },
  { label: "Pending", icon: Clock01Icon, color: "amber" },
  { label: "Banned", icon: UnavailableIcon, color: "red" },
];
const FAKE_CARDS = [
  { emoji: "🚀", title: "Launch week", text: "5 tasks left" },
  { emoji: "🐛", title: "Bug bash", text: "12 squashed" },
  { emoji: "📚", title: "Docs", text: "3 pages to write" },
  { emoji: "🎨", title: "Rebrand", text: "waiting on colors" },
];

const pickRandom = <T,>(items: T[], count: number) =>
  items.toSorted(() => Math.random() - 0.5).slice(0, count);

// the button sits under the content, so if the swap moved anything by even a
// pixel you'd see the button jump
function FinishLoadingButton({
  isLoading,
  onClick,
}: {
  isLoading: boolean;
  onClick: () => void;
}) {
  return (
    <Button variant="outline" size="sm" {...{ onClick }}>
      <Icon icon={isLoading ? Tick02Icon : RefreshIcon} />
      {isLoading ? "Finish loading" : "Load again"}
    </Button>
  );
}

function ListRowSkeletonDemo() {
  const [names, setNames] = useState<string[]>();
  const loadedRows = names?.map((name, index) => (
    <ListRow
      key={name}
      className="pop-items"
      leading={<UserAvatar {...{ name }} />}
      title={name}
      trailing={
        <EnumBadge
          value={
            FAKE_STATUSES[index % FAKE_STATUSES.length] ?? FAKE_STATUSES[0]
          }
        />
      }
    />
  ));
  return (
    <div className="flex w-full flex-col items-start gap-3">
      <div className="w-full">
        {loadedRows ? (
          <div className="pop-rows flex flex-col gap-2">{loadedRows}</div>
        ) : (
          <ListRowSkeleton count={3} />
        )}
      </div>
      <FinishLoadingButton
        isLoading={!names}
        onClick={() => setNames(names ? undefined : pickRandom(FAKE_NAMES, 3))}
      />
    </div>
  );
}

function CardGridSkeletonDemo() {
  const [cards, setCards] = useState<typeof FAKE_CARDS>();
  return (
    <div className="flex w-full flex-col items-start gap-3">
      <div className="w-full">
        {cards ? (
          <div className={cn("pop-rows", CARD_GRID_CLASS)}>
            {cards.map(({ emoji, title, text }) => (
              <div
                key={title}
                className={cn(
                  CARD_HEIGHT_CLASS,
                  "pop-items flex flex-col justify-between rounded-xl bg-muted p-4",
                )}
              >
                <span className="text-4xl">{emoji}</span>
                <span className="flex flex-col">
                  <span className="font-semibold">{title}</span>
                  <span className="text-sm text-muted-foreground">{text}</span>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <CardGridSkeleton count={2} />
        )}
      </div>
      <FinishLoadingButton
        isLoading={!cards}
        onClick={() => setCards(cards ? undefined : pickRandom(FAKE_CARDS, 2))}
      />
    </div>
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
    description:
      "loading placeholder for a feed / list, shares ListRow with the real rows so finishing moves nothing",
    Demo: ListRowSkeletonDemo,
  },
  {
    name: "CardGridSkeleton",
    path: "src/components/PageSkeleton.tsx",
    description:
      "grid of card placeholders, for a page-level suspense fallback. same grid and card height as the real cards",
    Demo: CardGridSkeletonDemo,
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
            className="flex items-center gap-2 rounded-lg bg-muted px-2.5 py-1.5 text-sm"
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
    Demo: LabelTagDemo,
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
            icon: Tick02Icon,
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
