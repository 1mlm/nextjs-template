import { parseAsString, useQueryState, useQueryStates } from "nuqs";
import { useMemo } from "react";
import type { CustomTableColumn, CustomTableEnumValue } from "./CustomTable";
import {
  type ColumnFilterField,
  columnMatchesFilter,
  compareColumnValues,
  getColumnFilterFields,
  getFilterKey,
  parseSort,
  serializeSort,
} from "./filtering";

// everything the global search box is allowed to match against for one row
function getSearchableStrings<T>(
  columns: CustomTableColumn<T>[],
  item: T,
): string[] {
  return columns.flatMap((column) => {
    if (column.type === "string") return [column.getString(item)];
    if (column.type === "copy")
      return column.searchable === false ? [] : [column.getString(item)];
    if (column.type === "enum") {
      const value = column.getValue(item);
      return value !== undefined
        ? [column.enumOptions[value]?.label ?? ""]
        : [];
    }
    if (column.type === "tags")
      return column.getTags(item).map((tag: CustomTableEnumValue) => tag.label);
    return [];
  });
}

// owns every URL-driven piece of "what's currently visible": the global
// search box, each column's filter fields, and sort - and turns them into
// the filtered/sorted item list. `search`, `filterValues`, `sortRaw` are
// exposed alongside the derived state so a caller can reset pagination
// whenever any of them changes
export function useTableFilterSort<T>({
  columns,
  items,
  filterable,
  sortable,
  searchQueryKey,
}: {
  columns: CustomTableColumn<T>[];
  items: T[];
  filterable: boolean;
  sortable: boolean;
  searchQueryKey: string;
}) {
  const [search] = useQueryState(searchQueryKey, { defaultValue: "" });
  const [sortRaw, setSortRaw] = useQueryState("sort", { defaultValue: "" });
  const sort = sortable ? parseSort(sortRaw) : null;

  const filterParsers = useMemo(
    () =>
      Object.fromEntries(
        filterable
          ? columns.flatMap((column) =>
              getColumnFilterFields(column).map((field) => [
                getFilterKey(column.id, field),
                parseAsString.withDefault(""),
              ]),
            )
          : [],
      ),
    [columns, filterable],
  );
  const [filterValues, setFilterValues] = useQueryStates(filterParsers);

  const getColumnField =
    (columnId: string) =>
    (field: ColumnFilterField): string =>
      filterValues[getFilterKey(columnId, field)] ?? "";
  const setColumnField = (
    columnId: string,
    field: ColumnFilterField,
    value: string,
  ) => setFilterValues({ [getFilterKey(columnId, field)]: value });
  const setColumnSort = (columnId: string, dir: "asc" | "desc" | null) =>
    setSortRaw(dir ? serializeSort({ columnId, dir }) : "");

  const hasActiveFilterOrSort =
    Object.values(filterValues).some(Boolean) || sort !== null;
  const resetFilterAndSort = () => {
    setFilterValues(
      Object.fromEntries(Object.keys(filterValues).map((key) => [key, ""])),
    );
    setSortRaw("");
  };

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = items.filter((item) => {
      if (
        query &&
        !getSearchableStrings(columns, item).some((s) =>
          s.toLowerCase().includes(query),
        )
      )
        return false;
      if (!filterable) return true;
      return columns.every((column) =>
        columnMatchesFilter(
          column,
          item,
          (field) => filterValues[getFilterKey(column.id, field)] ?? "",
        ),
      );
    });
    if (!sort) return filtered;
    const sortColumn = columns.find((column) => column.id === sort.columnId);
    if (!sortColumn) return filtered;
    const sorted = [...filtered].sort((a, b) =>
      compareColumnValues(sortColumn, a, b),
    );
    return sort.dir === "desc" ? sorted.reverse() : sorted;
  }, [items, columns, search, sort, filterValues, filterable]);

  return {
    visibleItems,
    sort,
    hasActiveFilterOrSort,
    resetFilterAndSort,
    getColumnField,
    setColumnField,
    setColumnSort,
    search,
    sortRaw,
    filterValues,
  };
}
