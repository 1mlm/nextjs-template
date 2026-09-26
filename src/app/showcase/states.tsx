"use client";

import {
  CheckmarkCircle02Icon,
  File02Icon,
  InboxIcon,
  Tag01Icon,
} from "@hugeicons/core-free-icons";
import { EmptyState, EmptyStateVariant } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Icon } from "@/components/Icon";
import { LabelTag } from "@/components/LabelTag";
import {
  CardGridSkeleton,
  ListRowSkeleton,
  TableBlockSkeleton,
} from "@/components/PageSkeleton";
import { AlignedNumber } from "@/components/table/AlignedNumber";
import { CornerCountBadge } from "@/components/table/CornerCountBadge";
import { EnumBadge } from "@/components/table/CustomTableCell";
import type { ShowcaseItem } from "./ShowcaseCard";

const ALIGNED_NUMBERS = [1.2, 3.4567, 120, 0.05];

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
