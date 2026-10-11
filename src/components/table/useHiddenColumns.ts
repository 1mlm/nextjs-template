import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import { useMemo } from "react";
import { ColumnType, type CustomTableColumn } from "./columns";

const isHideable = <T>(column: CustomTableColumn<T>) =>
  column.hideable !== false && column.type !== ColumnType.Buttons;

// columns the user hid through the header menu, kept in the url like the
// filters (?hide=email,role) so a reload or a shared link keeps them
export function useHiddenColumns<T>(columns: CustomTableColumn<T>[]) {
  const [hiddenIds, setHiddenIds] = useQueryState(
    "hide",
    parseAsArrayOf(parseAsString).withDefault([]),
  );
  const visibleColumns = useMemo(
    () => columns.filter((column) => !hiddenIds.includes(column.id)),
    [columns, hiddenIds],
  );
  // never the last visible one, a table with no columns is just a blank box
  const canHideMore = visibleColumns.length > 1;

  return {
    visibleColumns,
    hiddenCount: columns.length - visibleColumns.length,
    getHideHandler: (column: CustomTableColumn<T>) =>
      canHideMore && isHideable(column)
        ? () => setHiddenIds([...hiddenIds, column.id])
        : undefined,
    showAllColumns: () => setHiddenIds(null),
  };
}
