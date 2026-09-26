import type { ReactNode } from "react";
import { Skeleton } from "@/shadcn/ui/skeleton";

// the real row and its skeleton share this one layout, so when loading
// finishes nothing moves a single pixel. text slots sit in text-sm and the
// skeleton bars are h-lh (one line tall), same height as the words
export function ListRow({
  leading,
  title,
  trailing,
}: {
  leading: ReactNode;
  title: ReactNode;
  trailing: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm corner-squircle">
      <span className="grid size-8 shrink-0 place-items-center">{leading}</span>
      <span className="min-w-0 flex-1 truncate">{title}</span>
      <span className="flex h-6 shrink-0 items-center">{trailing}</span>
    </div>
  );
}

const getSkeletonKeys = (count: number) =>
  Array.from({ length: count }, (_, i) => `skeleton-${i}`);

// mimics a stack of icon+text rows, an activity feed, an attendance list, a document row list
export function ListRowSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {getSkeletonKeys(count).map((key) => (
        <ListRow
          key={key}
          leading={<Skeleton className="size-8 rounded-full" />}
          title={<Skeleton className="h-lh w-2/3" />}
          trailing={<Skeleton className="h-5 w-16 rounded-full" />}
        />
      ))}
    </div>
  );
}

export const CARD_GRID_CLASS =
  "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";
// fixed height on both sides of the swap, a real card that grows with its
// text would shove the whole grid down when it replaces the skeleton
export const CARD_HEIGHT_CLASS = "h-48";

// mimics a grid of cards
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className={CARD_GRID_CLASS}>
      {getSkeletonKeys(count).map((key) => (
        <Skeleton key={key} className={`${CARD_HEIGHT_CLASS} rounded-xl`} />
      ))}
    </div>
  );
}

// a table about to show up, header bar + some row bars. CustomTable already has
// its own column-shaped skeleton (`loading` prop), use this one where no
// CustomTable is mounted yet, like a page-level suspense fallback
export function TableBlockSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3 corner-squircle">
      <Skeleton className="h-8 w-full" />
      {getSkeletonKeys(rows).map((key) => (
        <Skeleton key={key} className="h-10 w-full" />
      ))}
    </div>
  );
}
