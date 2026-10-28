"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { memo, type ReactNode } from "react";
import { cn } from "@/shadcn/utils";

const CARD_CLASS =
  "rounded-xl bg-card p-3 text-sm ring-1 ring-border outline-none focus-visible:ring-2 focus-visible:ring-ring";

// what you see in the list. while it's the one being dragged it stays as a
// faint empty slot, the real card is the overlay under your pointer
function KanbanCardRow<T>({
  id,
  item,
  renderCard,
}: {
  id: string;
  item: T;
  renderCard: (item: T) => ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <li
      ref={setNodeRef}
      // translate only: sortable's scale would squash cards of different heights
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        CARD_CLASS,
        "cursor-grab touch-manipulation select-none active:cursor-grabbing",
        isDragging && "opacity-40 ring-dashed",
      )}
      {...attributes}
      {...listeners}
    >
      {renderCard(item)}
    </li>
  );
}

// memo is by item and renderCard, so a drag that only moves other cards
// doesn't re-render this one. memo drops the generic, hence the cast back
export const KanbanCard = memo(KanbanCardRow) as typeof KanbanCardRow;

// the copy that follows the pointer: lifted, a touch bigger and tilted
export function KanbanCardOverlay({ children }: { children: ReactNode }) {
  return (
    <div
      className={cn(
        CARD_CLASS,
        "scale-[1.03] rotate-2 cursor-grabbing shadow-xl shadow-black/20",
      )}
    >
      {children}
    </div>
  );
}
