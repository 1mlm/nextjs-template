"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { ReactNode } from "react";
import { cn } from "@/shadcn/utils";
import { getColorSwatch } from "@/utils/color";
import type { KanbanColumnData } from "./columns";

export function KanbanColumn<T>({
  column,
  itemIds,
  footer,
  emptyLabel,
  children,
}: {
  column: KanbanColumnData<T>;
  itemIds: string[];
  footer?: ReactNode;
  emptyLabel: string;
  children: ReactNode;
}) {
  // the column body is a drop target too, or an empty column couldn't take a card
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const isOverLimit =
    column.limit !== undefined && itemIds.length > column.limit;

  return (
    <section
      aria-label={column.title}
      className="flex h-full w-[85%] shrink-0 snap-center flex-col rounded-2xl bg-muted/60 p-2 ring-1 ring-border sm:w-72"
    >
      <header className="flex items-center gap-2 px-2 pt-1 pb-2">
        <span
          style={{ background: getColorSwatch(column.color) }}
          className="size-2.5 rounded-full corner-round"
        />
        <h3 className="text-sm font-semibold">{column.title}</h3>
        <span
          className={cn(
            "ml-auto text-xs tabular-nums",
            isOverLimit
              ? "font-semibold text-destructive"
              : "text-muted-foreground",
          )}
        >
          {itemIds.length}
          {column.limit !== undefined && `/${column.limit}`}
        </span>
      </header>
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <ul
          ref={setNodeRef}
          className={cn(
            "flex min-h-16 flex-1 flex-col gap-2 overflow-y-auto rounded-xl p-0.5 transition-colors",
            isOver && itemIds.length === 0 && "bg-foreground/5",
          )}
        >
          {children}
          {itemIds.length === 0 && (
            <li
              aria-hidden
              className="grid flex-1 place-items-center rounded-xl border border-dashed border-border text-xs text-muted-foreground"
            >
              {emptyLabel}
            </li>
          )}
        </ul>
      </SortableContext>
      {footer && <div className="pt-2">{footer}</div>}
    </section>
  );
}
