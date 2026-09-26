"use client";

import { DragDropVerticalIcon } from "@hugeicons/core-free-icons";
import { Reorder, useDragControls } from "motion/react";
import type { ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { cn } from "@/shadcn/utils";
import { triggerHaptic } from "@/utils/haptics";

const KEYBOARD_STEPS: Record<string, number> = { ArrowUp: -1, ArrowDown: 1 };

// moves one item by `step` places, clamped to the list
function moveItem<T>(items: T[], fromIndex: number, step: number) {
  const toIndex = Math.min(Math.max(fromIndex + step, 0), items.length - 1);
  if (toIndex === fromIndex) return items;
  const withoutItem = items.filter((_, index) => index !== fromIndex);
  const movedItem = items[fromIndex];
  if (movedItem === undefined) return items;
  return [
    ...withoutItem.slice(0, toIndex),
    movedItem,
    ...withoutItem.slice(toIndex),
  ];
}

function ReorderRow<T>({
  item,
  index,
  items,
  onReorder,
  children,
}: {
  item: T;
  index: number;
  items: T[];
  onReorder: (items: T[]) => void;
  children: ReactNode;
}) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      {...{ dragControls }}
      onDragEnd={() => triggerHaptic("light")}
      // scale only, animating boxShadow would wipe the ring (also a box-shadow)
      whileDrag={{ scale: 1.03 }}
      transition={{ type: "spring", bounce: 0.25, duration: 0.35 }}
      className="relative flex items-center gap-2 rounded-xl bg-card p-2 ring-1 ring-border corner-squircle"
    >
      {/* only the handle starts a drag, so text in the row stays selectable
      and scrolling a phone over the list doesn't grab rows. arrows work too */}
      <button
        type="button"
        aria-label="Drag to reorder, or use the arrow keys"
        onPointerDown={(event) => {
          triggerHaptic("selection");
          dragControls.start(event);
        }}
        onKeyDown={(event) => {
          const step = KEYBOARD_STEPS[event.key];
          if (step === undefined) return;
          event.preventDefault();
          triggerHaptic("selection");
          onReorder(moveItem(items, index, step));
        }}
        className="grid size-7 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-muted-foreground corner-squircle hover:bg-muted hover:text-foreground active:cursor-grabbing"
      >
        <Icon icon={DragDropVerticalIcon} className="size-4" />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </Reorder.Item>
  );
}

// a vertical list you rearrange by dragging the handle (or focusing it and
// pressing up/down). rows spring out of each other's way while you drag
export function ReorderList<T>({
  items,
  getItemId,
  onReorder,
  renderItem,
  className,
}: {
  items: T[];
  getItemId: (item: T) => string;
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
}) {
  return (
    <Reorder.Group
      axis="y"
      values={items}
      {...{ onReorder }}
      className={cn("flex flex-col gap-1.5", className)}
    >
      {items.map((item, index) => (
        <ReorderRow
          key={getItemId(item)}
          {...{ item, index, items, onReorder }}
        >
          {renderItem(item, index)}
        </ReorderRow>
      ))}
    </Reorder.Group>
  );
}
