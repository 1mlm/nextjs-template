import { useState } from "react";

// checkbox column selection. select all + the tri-state only look at
// `visibleItems`, so rows hidden by the filter don't count, but `selectedItems`
// reads from `allItems` so picks survive the filter changing (pick some rows,
// narrow the search, export, still all there)
export function useRowSelection<T>({
  allItems,
  visibleItems,
  getItemId,
}: {
  allItems: T[];
  visibleItems: T[];
  getItemId: (item: T) => string;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const visibleIds = visibleItems.map(getItemId);
  const visibleSelectedCount = visibleIds.filter((id) =>
    selectedIds.has(id),
  ).length;
  const allVisibleSelected =
    visibleIds.length > 0 && visibleSelectedCount === visibleIds.length;

  const toggleAll = () =>
    setSelectedIds(
      allVisibleSelected
        ? new Set([...selectedIds].filter((id) => !visibleIds.includes(id)))
        : new Set([...selectedIds, ...visibleIds]),
    );

  const selectedItems = allItems.filter((item) =>
    selectedIds.has(getItemId(item)),
  );

  return {
    selectedIds,
    visibleSelectedCount,
    toggleRow,
    toggleAll,
    selectedItems,
  };
}
