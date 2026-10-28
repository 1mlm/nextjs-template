import type { Color } from "@/utils/color";

export type KanbanColumnData<T> = {
  id: string;
  title: string;
  color: Color;
  // past this many cards the count turns red, it never blocks a drop
  limit?: number;
  items: T[];
};

type GetItemId<T> = (item: T) => string;

// the column that holds a card, or the column itself when the id is a column
// (dropping on an empty column's body)
export function findColumn<T>(
  columns: KanbanColumnData<T>[],
  id: string,
  getItemId: GetItemId<T>,
) {
  return (
    columns.find((column) => column.id === id) ??
    columns.find((column) =>
      column.items.some((item) => getItemId(item) === id),
    )
  );
}

// the card hops to the column it's hovering, landing before or after the card
// under it. while a card stays in its own column dnd-kit's sortable transforms
// do the shuffling and nothing here runs
export function moveToColumn<T>({
  columns,
  activeId,
  overId,
  isBelowOver,
  getItemId,
}: {
  columns: KanbanColumnData<T>[];
  activeId: string;
  overId: string;
  isBelowOver: boolean;
  getItemId: GetItemId<T>;
}) {
  const from = findColumn(columns, activeId, getItemId);
  const to = findColumn(columns, overId, getItemId);
  if (!from || !to || from.id === to.id) return columns;
  const moved = from.items.find((item) => getItemId(item) === activeId);
  if (!moved) return columns;

  const overIndex = to.items.findIndex((item) => getItemId(item) === overId);
  const insertAt =
    overIndex >= 0 ? overIndex + (isBelowOver ? 1 : 0) : to.items.length;

  return columns.map((column) => {
    if (column.id === from.id)
      return {
        ...column,
        items: column.items.filter((item) => item !== moved),
      };
    if (column.id === to.id)
      return {
        ...column,
        items: [
          ...column.items.slice(0, insertAt),
          moved,
          ...column.items.slice(insertAt),
        ],
      };
    return column;
  });
}

// a board's shape as one string, to tell a real change from a drop in place
export const getBoardSignature = <T>(
  columns: KanbanColumnData<T>[],
  getItemId: GetItemId<T>,
) =>
  columns
    .map(({ id, items }) => `${id}:${items.map(getItemId).join(",")}`)
    .join("|");
