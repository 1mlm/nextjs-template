import { parseAsString, useQueryState, useQueryStates } from "nuqs";
import { useMemo } from "react";
import {
  ColumnType,
  type CustomTableColumn,
  type CustomTableEnumValue,
} from "./columns";
import {
  type ColumnFilterField,
  type CustomTableSort,
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

type SortKey = NonNullable<CustomTableSort>;

// compares by each key in turn until one breaks the tie
function compareBySortKeys<T>(
  columns: CustomTableColumn<T>[],
  sortKeys: SortKey[],
  a: T,
  b: T,
) {
  return sortKeys.reduce((result, { columnId, dir }) => {
    if (result !== 0) return result;
    const column = columns.find(({ id }) => id === columnId);
    if (!column) return 0;
    const direction = dir === SortDirection.Desc ? -1 : 1;
    return compareColumnValues(column, a, b) * direction;
  }, 0);
}

// pinned rows go first in the order given, everything else keeps its place
function movePinnedFirst<T>(
  items: T[],
  pinnedItemIds: string[],
  getItemId: (item: T) => string,
) {
  const pinnedIds = new Set(pinnedItemIds);
  const pinnedItems = pinnedItemIds.flatMap((id) =>
    items.filter((item) => getItemId(item) === id),
  );
  return [
    ...pinnedItems,
    ...items.filter((item) => !pinnedIds.has(getItemId(item))),
  ];
}

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
  defaultSort,
  pinnedItemIds,
  getItemId,
}: {
  columns: CustomTableColumn<T>[];
  items: T[];
  filterable: boolean;
  sortable: boolean;
  searchQueryKey: string;
  defaultSort: SortKey[];
  pinnedItemIds: string[];
  getItemId: (item: T) => string;
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
    // the user's own sort wins, defaultSort only orders an unsorted table
    const sortKeys = sort ? [sort] : defaultSort;
    const sorted = [...filtered].sort((a, b) =>
      compareBySortKeys(columns, sortKeys, a, b),
    );
    return movePinnedFirst(sorted, pinnedItemIds, getItemId);
  }, [
    items,
    columns,
    search,
    sort,
    defaultSort,
    filterValues,
    filterable,
    pinnedItemIds,
    getItemId,
  ]);

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
