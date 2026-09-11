"use client";

import { BrushCleaningIcon, InboxIcon } from "@hugeicons/core-free-icons";
import { type ReactNode, useEffect } from "react";
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
import { CustomTableSkeletonRows } from "./CustomTableSkeletonRows";
import { ExtractButton } from "./ExtractButton";
import { type ColumnFilterField, getTriState } from "./filtering";
import { useRowSelection } from "./useRowSelection";
import { useScrollFade } from "./useScrollFade";
import { useTableFilterSort } from "./useTableFilterSort";
import { useTablePagination } from "./useTablePagination";

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
  const {
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
  } = useTableFilterSort({
    columns,
    items,
    filterable,
    sortable,
    searchQueryKey,
  });

  useEffect(() => {
    onVisibleCountChange?.(visibleItems.length);
  }, [visibleItems, onVisibleCountChange]);

  const {
    page: currentPage,
    setPage,
    pageCount,
    paginatedItems,
  } = useTablePagination({ items: visibleItems, paginate });

  // biome-ignore lint/correctness/useExhaustiveDependencies: only used to trigger the reset, not read
  useEffect(() => {
    setPage(1);
  }, [search, filterValues, sortRaw, setPage]);

  const { selectedIds, toggleRow, toggleAll, selectedItems } = useRowSelection({
    allItems: items,
    visibleItems,
    getItemId,
  });

  const canResetFilterAndSort =
    (filterable || sortable) && hasActiveFilterOrSort;
  const hasSelection = Boolean(selectable) && selectedIds.size > 0;
  const showActionBar = canResetFilterAndSort || hasSelection || pageCount > 1;

  const { scrollContainerRef, checkboxColumnRef, maskImage } = useScrollFade(
    paginatedItems.length,
  );

  return (
    <div className="rounded-md overflow-clip">
      <div
        ref={scrollContainerRef}
        className="w-full max-h-[70vh] overflow-auto"
        style={{ maskImage, WebkitMaskImage: maskImage }}
      >
        <table className="w-full caption-bottom text-sm">
          <TableHeader>
            <TableRow className="*:sticky *:top-0 *:outline *:outline-border *:text-center *:text-xs *:bg-muted *:px-4">
              {selectable && (
                <TableHead ref={checkboxColumnRef} className="left-0 z-20">
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
                      setColumnSort(column.id, dir)
                    }
                  />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <CustomTableSkeletonRows {...{ columns, selectable }} />
            )}
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
                      <TableCell className="sticky left-0 z-10 border-r border-border/50 text-center">
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
