import { useState } from "react";

// checkbox-column selection. `visibleItems` (not `allItems`) drives "select
// all" and the tri-state checkbox, so a row scrolled out of the current
// filter doesn't count against "all selected" - but `selectedItems` reads
// from `allItems`, so a selection survives the filter changing underneath
// it (e.g. exporting rows picked before narrowing the search)
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

  const allSelected =
    visibleItems.length > 0 && selectedIds.size === visibleItems.length;
  const toggleAll = () =>
    setSelectedIds(
      allSelected ? new Set() : new Set(visibleItems.map(getItemId)),
    );

  const selectedItems = allItems.filter((item) =>
    selectedIds.has(getItemId(item)),
  );

  return { selectedIds, toggleRow, toggleAll, selectedItems };
}
