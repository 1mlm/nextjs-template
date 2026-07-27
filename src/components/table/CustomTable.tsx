"use client";

import { BrushCleaningIcon, InboxIcon } from "@hugeicons/core-free-icons";
import {
  parseAsInteger,
  parseAsString,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { type HugeIcon, Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
import { Checkbox } from "@/shadcn/ui/checkbox";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/shadcn/ui/pagination";
import { Skeleton } from "@/shadcn/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/ui/table";
import { cn } from "@/shadcn/utils";
import { CustomTableCell } from "./CustomTableCell";
import { CustomTableColumnHeader } from "./CustomTableColumnHeader";
import { ExtractButton } from "./ExtractButton";
import {
  type ColumnFilterField,
  columnMatchesFilter,
  compareColumnValues,
  getColumnFilterFields,
  getFilterKey,
  getTriState,
  parseSort,
  serializeSort,
} from "./filtering";

const PAGE_SIZE = 25;

const SKELETON_ROW_KEYS = Array.from({ length: 8 }, (_, i) => `skeleton-${i}`);

export type CustomTableEnumValue = {
  label: string;
  icon: HugeIcon;
  // free string, not the narrow Color union — a fixed status badge passes a literal
  // (e.g. 'green'), but a user-editable tag passes whatever colorId it was saved with
  color: string;
  // extra terms matched by tag text-search filters but never displayed
  keywords?: string[];
  // makes the badge itself clickable, e.g. a tag opening a detail view
  onClick?: () => void;
};

export type CustomTableColumn<T> = {
  id: string;
  label: string;
  icon: HugeIcon;
} & (
  | {
      type: "string";
      monospace?: boolean;
      align?: "left" | "right";
      // 'number' switches the filter UI from a text search to a min/max range
      filterType?: "text" | "number";
      // used for the numeric range filter/sort when getString isn't a raw parsable number (e.g. formatted currency)
      getNumber?: (item: T) => number;
      // truncates the middle instead of the end, keeping both the start and the tail visible
      truncate?: "middle";
      getString: (item: T) => string;
      // renders the value as a clickable button instead of plain text
      onClick?: (item: T) => void;
    }
  | {
      type: "copy";
      // opt out of the global search box, e.g. a raw url whose random path segments false-match everything
      searchable?: boolean;
      getString: (item: T) => string;
    }
  | { type: "date"; getDate: (item: T) => Date | undefined }
  | { type: "boolean"; getBoolean: (item: T) => boolean; trueIcon?: HugeIcon }
  | {
      type: "enum";
      enumOptions: Record<string, CustomTableEnumValue>;
      getValue: (item: T) => string | undefined;
      // optional extra detail shown in a popover when the badge is clicked, e.g. a
      // status's timestamp — most enum columns don't need this
      getPopoverContent?: (item: T) => ReactNode;
    }
  | {
      type: "tags";
      getTags: (item: T) => CustomTableEnumValue[];
    }
  | { type: "buttons"; getButtons: (item: T) => ReactNode }
);

// raw, spreadsheet-friendly value for a column (dates as ISO, enums as their underlying key, tags joined by comma)
export function getColumnExportValue<T>(
  column: CustomTableColumn<T>,
  item: T,
): string {
  if (column.type === "string" || column.type === "copy")
    return column.getString(item);
  if (column.type === "date") return column.getDate(item)?.toISOString() ?? "";
  if (column.type === "boolean")
    return column.getBoolean(item) ? "true" : "false";
  if (column.type === "tags")
    return column
      .getTags(item)
      .map((tag) => tag.label)
      .join(", ");
  if (column.type === "buttons") return "";
  return column.getValue(item) ?? "";
}

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
      return column.getTags(item).map((tag) => tag.label);
    return [];
  });
}

export function CustomTable<T>({
  items,
  columns,
  getItemId,
  loading,
  selectable,
  filterable = true,
  sortable = true,
  paginate = true,
  searchQueryKey = "q",
  exportFilePrefix = "export",
  onVisibleCountChange,
  emptyLabel = "items",
}: {
  items: T[];
  columns: CustomTableColumn<T>[];
  getItemId: (item: T) => string;
  loading?: boolean;
  selectable?: boolean;
  // table-wide switches, on top of each column's own type-based eligibility
  filterable?: boolean;
  sortable?: boolean;
  // turn off for short lists where paging just adds a click
  paginate?: boolean;
  // must match the queryKey given to the page's SearchBar
  searchQueryKey?: string;
  exportFilePrefix?: string;
  // reports how many rows survive the current search/filter, e.g. for a "12 results" indicator
  onVisibleCountChange?: (count: number) => void;
  // shown in the empty state, e.g. "users" -> "No users to show"
  emptyLabel?: string;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search] = useQueryState(searchQueryKey, { defaultValue: "" });
  const [sortRaw, setSortRaw] = useQueryState("sort", { defaultValue: "" });
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));

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

  const sort = sortable ? parseSort(sortRaw) : null;
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

  useEffect(() => {
    onVisibleCountChange?.(visibleItems.length);
  }, [visibleItems, onVisibleCountChange]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: only used to trigger the reset, not read
  useEffect(() => {
    setPage(1);
  }, [search, filterValues, sortRaw, setPage]);

  const pageCount = paginate
    ? Math.max(1, Math.ceil(visibleItems.length / PAGE_SIZE))
    : 1;
  const currentPage = Math.min(Math.max(page, 1), pageCount);
  const paginatedItems = paginate
    ? visibleItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
    : visibleItems;

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

  const canResetFilterAndSort =
    (filterable || sortable) && hasActiveFilterOrSort;
  const hasSelection = Boolean(selectable) && selectedIds.size > 0;
  const showActionBar = canResetFilterAndSort || hasSelection || pageCount > 1;

  const selectedItems = items.filter((item) =>
    selectedIds.has(getItemId(item)),
  );

  return (
    <div className="rounded-md overflow-clip">
      <div className="w-full overflow-x-auto">
        <table className="w-full caption-bottom text-sm">
          <TableHeader>
            <TableRow className="*:sticky *:top-0 *:outline *:outline-border *:text-center *:text-xs *:bg-muted *:px-4">
              {selectable && (
                <TableHead>
                  <div className="flex justify-center pr-2!">
                    <Checkbox
                      checked={getTriState(
                        selectedIds.size,
                        visibleItems.length,
                      )}
                      onCheckedChange={toggleAll}
                      aria-label="Select all rows"
                    />
                  </div>
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead key={column.id}>
                  <CustomTableColumnHeader
                    {...{ column, items, filterable, sortable }}
                    getField={getColumnField(column.id)}
                    setField={(field: ColumnFilterField, value: string) =>
                      setColumnField(column.id, field, value)
                    }
                    sort={sort?.columnId === column.id ? sort.dir : null}
                    onSortChange={(dir: "asc" | "desc" | null) =>
                      setSortRaw(
                        dir ? serializeSort({ columnId: column.id, dir }) : "",
                      )
                    }
                  />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading &&
              SKELETON_ROW_KEYS.map((key, index) => (
                <TableRow
                  key={key}
                  className={cn(index % 2 === 1 && "bg-foreground/5")}
                >
                  {selectable && (
                    <TableCell className="border-r border-border/50">
                      <div className="flex justify-center pr-2!">
                        <Skeleton className="size-4" />
                      </div>
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      className="border-r border-border/50 last:border-r-0"
                    >
                      <Skeleton className="h-4 w-full min-w-12" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!loading &&
              paginatedItems.map((item, index) => {
                const id = getItemId(item);
                return (
                  <TableRow
                    key={id}
                    className={cn(
                      "group/row",
                      index % 2 === 1 && "bg-foreground/5",
                      selectedIds.has(id) && "bg-green-500/15",
                    )}
                  >
                    {selectable && (
                      <TableCell className="border-r border-border/50 text-center">
                        <div className="flex justify-center pr-2!">
                          <Checkbox
                            checked={selectedIds.has(id)}
                            onCheckedChange={() => toggleRow(id)}
                            aria-label="Select row"
                          />
                        </div>
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell
                        key={column.id}
                        className={cn(
                          "border-r border-border/50 last:border-r-0",
                          column.type === "string" &&
                            column.align === "right" &&
                            "text-right",
                          (column.type === "copy" ||
                            column.type === "enum" ||
                            column.type === "tags" ||
                            column.type === "buttons") &&
                            "text-center",
                        )}
                      >
                        <CustomTableCell {...{ column, item }} />
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
          </TableBody>
        </table>
      </div>
      {!loading && visibleItems.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 p-10 text-muted-foreground border-t border-border">
          <Icon icon={InboxIcon} className="size-8" />
          <span className="text-sm">No {emptyLabel} to show</span>
        </div>
      )}
      {showActionBar && (
        <div className="fixed inset-x-4 bottom-4 flex flex-col items-end gap-2 sm:inset-x-auto sm:bottom-8 sm:right-8 sm:flex-row border border-border bg-sidebar px-4 py-2 rounded-full corner-squircle shadow-[0_0_16px_rgba(0,0,0,0.35)]">
          {pageCount > 1 && (
            <Pagination className="w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : undefined
                    }
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) setPage(currentPage - 1);
                    }}
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="px-2 text-sm whitespace-nowrap text-muted-foreground">
                    Page {currentPage} of {pageCount}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    className={
                      currentPage === pageCount
                        ? "pointer-events-none opacity-50"
                        : undefined
                    }
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < pageCount) setPage(currentPage + 1);
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
          {canResetFilterAndSort && (
            <Button
              variant="outline"
              className="shadow-lg"
              onClick={resetFilterAndSort}
            >
              <Icon icon={BrushCleaningIcon} />
              <span className="hidden sm:inline">
                Reset filters &amp; sorting
              </span>
              <span className="sm:hidden">Reset</span>
            </Button>
          )}
          {selectable && (
            <ExtractButton
              {...{ selectedItems, columns }}
              filePrefix={exportFilePrefix}
            />
          )}
        </div>
      )}
    </div>
  );
}
