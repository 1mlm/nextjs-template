import { parseAsString, useQueryState, useQueryStates } from "nuqs";
import { useMemo } from "react";
import {
  ColumnType,
  type CustomTableColumn,
  type CustomTableEnumValue,
} from "./columns";
import {
  type ColumnFilterField,
  columnMatchesFilter,
  compareColumnValues,
  getColumnFilterFields,
  getFilterKey,
  parseSort,
  SortDirection,
  serializeSort,
} from "./filtering";

// everything the global search box is allowed to match against for one row
function getSearchableStrings<T>(
  columns: CustomTableColumn<T>[],
  item: T,
): string[] {
  return columns.flatMap((column) => {
    if (column.type === ColumnType.String) return [column.getString(item)];
    if (column.type === ColumnType.Copy)
      return column.searchable === false ? [] : [column.getString(item)];
    if (column.type === ColumnType.Enum) {
      const value = column.getValue(item);
      return value !== undefined
        ? [column.enumOptions[value]?.label ?? ""]
        : [];
    }
    if (column.type === ColumnType.Tags)
      return column.getTags(item).map((tag: CustomTableEnumValue) => tag.label);
    return [];
  });
}

// plain function (not a closure inside the hook) so the visibleItems memo can call it without a new dep
const readColumnField =
  (filterValues: Partial<Record<string, string>>, columnId: string) =>
  (field: ColumnFilterField) =>
    filterValues[getFilterKey(columnId, field)] ?? "";

// owns everything url driven about what's visible: the search box, every
// column's filter fields and the sort, and turns it into the filtered/sorted
// list. `search`, `filterValues` and `sortRaw` are handed back too so the
// caller can reset pagination when any of them changes
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

  const getColumnField = (columnId: string) =>
    readColumnField(filterValues, columnId);
  const setColumnField = (
    columnId: string,
    field: ColumnFilterField,
    value: string,
  ) => setFilterValues({ [getFilterKey(columnId, field)]: value });
  const setColumnSort = (columnId: string, dir: SortDirection | null) =>
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
      const matchesSearch =
        !query ||
        getSearchableStrings(columns, item).some((s) =>
          s.toLowerCase().includes(query),
        );
      if (!matchesSearch) return false;
      if (!filterable) return true;
      return columns.every((column) =>
        columnMatchesFilter(
          column,
          item,
          readColumnField(filterValues, column.id),
        ),
      );
    });
    if (!sort) return filtered;
    const sortColumn = columns.find((column) => column.id === sort.columnId);
    if (!sortColumn) return filtered;
    const sorted = [...filtered].sort((a, b) =>
      compareColumnValues(sortColumn, a, b),
    );
    return sort.dir === SortDirection.Desc ? sorted.reverse() : sorted;
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
