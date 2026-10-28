"use client";

import {
  type CollisionDetection,
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
  KeyboardSensor,
  MouseSensor,
  pointerWithin,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { type ReactNode, useCallback, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/shadcn/utils";
import { triggerHaptic } from "@/utils/haptics";
import { useIsClient } from "@/utils/useIsClient";
import {
  findColumn,
  getBoardSignature,
  type KanbanColumnData,
  moveToColumn,
} from "./columns";
import { KanbanCard, KanbanCardOverlay } from "./KanbanCard";
import { KanbanColumn } from "./KanbanColumn";

// a touch has to rest 200ms before it picks a card up, so swiping to scroll
// the board or a column still scrolls. a mouse needs a few pixels of travel,
// so clicks inside a card stay clicks
const MOUSE_ACTIVATION = { distance: 6 };
const TOUCH_ACTIVATION = { delay: 200, tolerance: 8 };

const KEYBOARD_STEPS: Record<string, { column: number; item: number }> = {
  ArrowUp: { column: 0, item: -1 },
  ArrowDown: { column: 0, item: 1 },
  ArrowLeft: { column: -1, item: 0 },
  ArrowRight: { column: 1, item: 0 },
};

const DROP_ANIMATION = {
  duration: 240,
  easing: "cubic-bezier(0.32, 0.72, 0, 1)",
};

// columns of cards you drag between and within, with a mouse, a finger or
// the keyboard (space picks up, arrows move, space drops, escape cancels).
// it works on a copy of the board while you drag and only calls
// onColumnsChange once, on a drop that changed something. renderCard should
// be stable (useCallback) so cards aren't re-rendered on every pointer move
export function KanbanBoard<T>({
  columns,
  onColumnsChange,
  getItemId,
  getItemLabel,
  renderCard,
  renderColumnFooter,
  emptyLabel = "drop a card here",
  className,
}: {
  columns: KanbanColumnData<T>[];
  onColumnsChange: (columns: KanbanColumnData<T>[]) => void;
  getItemId: (item: T) => string;
  // what a screen reader announces for a card
  getItemLabel: (item: T) => string;
  renderCard: (item: T) => ReactNode;
  renderColumnFooter?: (column: KanbanColumnData<T>) => ReactNode;
  emptyLabel?: string;
  // give it a height, the columns scroll inside it
  className?: string;
}) {
  // the copy being rearranged while a drag is on, null the rest of the time
  const [draft, setDraft] = useState<KanbanColumnData<T>[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const shownColumns = draft ?? columns;
  const activeItem = shownColumns
    .flatMap((column) => column.items)
    .find((item) => getItemId(item) === activeId);

  // dnd-kit numbers its screen reader text with a counter, and the server and
  // the browser count differently unless the context has a stable id
  const dndId = useId();
  const isClient = useIsClient();
  const lastColumnId = useRef<string>(undefined);

  // two steps: the column the pointer is in (the last one while it crosses a
  // gap, so it never jumps to some far column), then the card in that column
  // nearest the pointer's height. a card hovered in the gap between two
  // cards still has a clear neighbour, and an empty column is the target itself
  const detectCollision: CollisionDetection = useCallback(
    (args) => {
      const columnIds = new Set(shownColumns.map((column) => column.id));
      const columnArgs = {
        ...args,
        droppableContainers: args.droppableContainers.filter((container) =>
          columnIds.has(String(container.id)),
        ),
      };
      // the keyboard has no pointer, the card's own center stands in for it
      const columnHit = (
        args.pointerCoordinates
          ? pointerWithin(columnArgs)
          : closestCenter(columnArgs)
      )[0];
      const columnId = columnHit ? String(columnHit.id) : lastColumnId.current;
      const column = shownColumns.find(({ id }) => id === columnId);
      if (!column) return [];
      lastColumnId.current = column.id;

      const itemIds = new Set(column.items.map(getItemId));
      const cards = args.droppableContainers.filter((container) =>
        itemIds.has(String(container.id)),
      );
      if (cards.length === 0) return [{ id: column.id }];

      const { collisionRect, pointerCoordinates } = args;
      const pointerY =
        pointerCoordinates?.y ?? collisionRect.top + collisionRect.height / 2;
      const distanceToPointer = (id: string | number) => {
        const rect = args.droppableRects.get(id);
        return rect
          ? Math.abs(rect.top + rect.height / 2 - pointerY)
          : Infinity;
      };
      const nearest = cards.reduce((best, card) =>
        distanceToPointer(card.id) < distanceToPointer(best.id) ? card : best,
      );
      return [{ id: nearest.id }];
    },
    [shownColumns, getItemId],
  );

  // up and down step through the cards of the column, left and right hop to
  // the next column at the same height (its last card if it's shorter, the
  // empty body if there's nothing). dnd-kit's own sortable getter reads
  // rects, which hops to the wrong neighbour when columns sit side by side
  // the sensor keeps the getter it was created with for the whole drag, so
  // it reads the board through a ref or it would keep seeing the first one
  const shownColumnsRef = useRef(shownColumns);
  shownColumnsRef.current = shownColumns;
  const getKeyboardCoordinates: KeyboardCoordinateGetter = useCallback(
    (event, { context: { active, over, droppableRects } }) => {
      const shownColumns = shownColumnsRef.current;
      const step = KEYBOARD_STEPS[event.code];
      if (!step || !active) return;
      event.preventDefault();
      // within a column the card only moves on drop, so "where it is" is
      // whatever card it's currently over
      const hereId = String(over?.id ?? active.id);
      const column = findColumn(shownColumns, hereId, getItemId);
      if (!column) return;
      const itemIndex = column.items.findIndex(
        (item) => getItemId(item) === hereId,
      );
      const columnIndex = shownColumns.indexOf(column);

      const targetColumn = shownColumns[columnIndex + step.column];
      const targetItem = step.column
        ? targetColumn?.items[
            Math.min(itemIndex, targetColumn.items.length - 1)
          ]
        : column.items[itemIndex + step.item];
      const emptyColumnId = step.column ? targetColumn?.id : undefined;
      const targetId = targetItem ? getItemId(targetItem) : emptyColumnId;
      const rect = targetId ? droppableRects.get(targetId) : undefined;
      return rect && { x: rect.left, y: rect.top };
    },
    [getItemId],
  );

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: MOUSE_ACTIVATION }),
    useSensor(TouchSensor, { activationConstraint: TOUCH_ACTIVATION }),
    useSensor(KeyboardSensor, { coordinateGetter: getKeyboardCoordinates }),
  );

  const handleDragStart = ({ active }: DragStartEvent) => {
    triggerHaptic("medium");
    lastColumnId.current = undefined;
    setActiveId(String(active.id));
    setDraft(columns);
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || !draft) return;
    const translated = active.rect.current.translated;
    const isBelowOver =
      translated !== null &&
      translated.top > over.rect.top + over.rect.height / 2;
    const moved = moveToColumn({
      columns: draft,
      activeId: String(active.id),
      overId: String(over.id),
      isBelowOver,
      getItemId,
    });
    if (moved === draft) return;
    triggerHaptic("selection");
    setDraft(moved);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const board = draft ?? columns;
    const column = findColumn(board, String(active.id), getItemId);
    let result = board;
    if (column && over) {
      const ids = column.items.map(getItemId);
      const fromIndex = ids.indexOf(String(active.id));
      const overIndex = ids.indexOf(String(over.id));
      // dropped on the column body itself: it goes to the end
      const toIndex = overIndex >= 0 ? overIndex : ids.length - 1;
      if (fromIndex !== toIndex)
        result = board.map((candidate) =>
          candidate.id === column.id
            ? {
                ...candidate,
                items: arrayMove(candidate.items, fromIndex, toIndex),
              }
            : candidate,
        );
    }
    setDraft(null);
    setActiveId(null);
    triggerHaptic("light");
    if (
      getBoardSignature(result, getItemId) !==
      getBoardSignature(columns, getItemId)
    )
      onColumnsChange(result);
  };

  const handleDragCancel = () => {
    setDraft(null);
    setActiveId(null);
  };

  const getColumnTitle = (id: string) =>
    findColumn(shownColumns, id, getItemId)?.title ?? "";
  const getLabel = (id: string) => {
    const item = shownColumns
      .flatMap((column) => column.items)
      .find((candidate) => getItemId(candidate) === id);
    return item ? getItemLabel(item) : id;
  };
  const getPosition = (id: string) => {
    const items = findColumn(shownColumns, id, getItemId)?.items ?? [];
    const index = items.findIndex((item) => getItemId(item) === id);
    return `position ${index + 1} of ${items.length}`;
  };

  return (
    <DndContext
      id={dndId}
      {...{ sensors }}
      collisionDetection={detectCollision}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      autoScroll={{ threshold: { x: 0.15, y: 0.2 }, acceleration: 12 }}
      accessibility={{
        screenReaderInstructions: {
          draggable:
            "Press space to pick up this card. Use the arrow keys to move it, space to drop it, escape to cancel.",
        },
        announcements: {
          onDragStart: ({ active }) =>
            `Picked up ${getLabel(String(active.id))} from ${getColumnTitle(String(active.id))}.`,
          onDragOver: ({ active, over }) =>
            over
              ? `${getLabel(String(active.id))} is over ${getColumnTitle(String(over.id))}, ${getPosition(String(active.id))}.`
              : undefined,
          onDragEnd: ({ active, over }) =>
            over
              ? `Dropped ${getLabel(String(active.id))} in ${getColumnTitle(String(over.id))}, ${getPosition(String(active.id))}.`
              : `Dropped ${getLabel(String(active.id))}.`,
          onDragCancel: ({ active }) =>
            `Cancelled, ${getLabel(String(active.id))} stays where it was.`,
        },
      }}
    >
      <div
        // snapping fights the autoscroll while a card is being carried to
        // another column, so it only snaps when nothing is held.
        className={cn(
          "flex gap-3 overflow-x-auto pb-2",
          // moving the mouse across the headers would select their text
          activeId ? "snap-none select-none" : "snap-x snap-mandatory",
          className,
        )}
      >
        {shownColumns.map((column) => (
          <KanbanColumn
            key={column.id}
            {...{ column, emptyLabel }}
            itemIds={column.items.map(getItemId)}
            footer={renderColumnFooter?.(column)}
          >
            {column.items.map((item) => (
              <KanbanCard
                key={getItemId(item)}
                id={getItemId(item)}
                {...{ item, renderCard }}
              />
            ))}
          </KanbanColumn>
        ))}
      </div>
      {/* in the body, not in place: it's position fixed, and any ancestor with
      a transform, filter or contain (a card, a dialog, an animated page)
      would turn that into "fixed to me" and the card would float off */}
      {isClient &&
        createPortal(
          <DragOverlay dropAnimation={DROP_ANIMATION}>
            {activeItem && (
              <KanbanCardOverlay>{renderCard(activeItem)}</KanbanCardOverlay>
            )}
          </DragOverlay>,
          document.body,
        )}
    </DndContext>
  );
}
