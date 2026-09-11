import { Skeleton } from "@/shadcn/ui/skeleton";

// mimics a stack of icon+text rows — an activity feed, an attendance list, a document row list
export function ListRowSkeleton({ count = 5 }: { count?: number }) {
  const rowKeys = Array.from({ length: count }, (_, i) => `row-${i}`);
  return (
    <div className="flex flex-col gap-2">
      {rowKeys.map((key) => (
        <div
          key={key}
          className="flex items-center gap-3 rounded-md border border-border p-3"
        >
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-6 w-20 shrink-0 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

// mimics a grid of cards
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  const cardKeys = Array.from({ length: count }, (_, i) => `card-${i}`);
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cardKeys.map((key) => (
        <Skeleton key={key} className="h-48 rounded-xl" />
      ))}
    </div>
  );
}

// mimics a data table about to appear — a header bar plus a few row bars.
// CustomTable has its own richer loading state (column-shaped skeleton
// cells via its `loading` prop) - reach for this one only where a full
// CustomTable isn't in play yet, e.g. a page-level Suspense fallback
export function TableBlockSkeleton({ rows = 6 }: { rows?: number }) {
  const rowKeys = Array.from({ length: rows }, (_, i) => `row-${i}`);
  return (
    <div className="flex flex-col gap-2 rounded-md border border-border p-3">
      <Skeleton className="h-8 w-full" />
      {rowKeys.map((key) => (
        <Skeleton key={key} className="h-10 w-full" />
      ))}
    </div>
  );
}
