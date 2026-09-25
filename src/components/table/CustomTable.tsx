"use client";

import { BrushCleaningIcon, InboxIcon } from "@hugeicons/core-free-icons";
import { useEffect, useRef } from "react";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/Icon";
import { DEFAULT_SEARCH_QUERY_KEY } from "@/components/SearchBar";
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
import { ColumnAlign, ColumnType, type CustomTableColumn } from "./columns";
import { ExtractButton } from "./ExtractButton";
import {
  type ColumnFilterField,
  getTriState,
  type SortDirection,
} from "./filtering";
import { useRowSelection } from "./useRowSelection";
import { useScrollFade } from "./useScrollFade";
import { useTableFilterSort } from "./useTableFilterSort";
import { useTablePagination } from "./useTablePagination";

const CENTERED_COLUMN_TYPES = new Set([
  ColumnType.Copy,
  ColumnType.Enum,
  ColumnType.Tags,
  ColumnType.Buttons,
]);

export function CustomTable<T>({
  items,
  columns,
  getItemId,
  loading,
  selectable,
  filterable = true,
  sortable = true,
  paginate = true,
  searchQueryKey = DEFAULT_SEARCH_QUERY_KEY,
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

  // compared against the last seen key instead of just running on change,
  // otherwise the mount run wipes a deep-linked ?page=3
  const filterSortKey = JSON.stringify([search, filterValues, sortRaw]);
  const lastFilterSortKeyRef = useRef(filterSortKey);
  useEffect(() => {
    if (lastFilterSortKeyRef.current === filterSortKey) return;
    lastFilterSortKeyRef.current = filterSortKey;
    setPage(1);
  }, [filterSortKey, setPage]);

  const {
    selectedIds,
    visibleSelectedCount,
    toggleRow,
    toggleAll,
    selectedItems,
  } = useRowSelection({
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
                        visibleSelectedCount,
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
                    onSortChange={(dir: SortDirection | null) =>
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
                          column.type === ColumnType.String &&
                            column.align === ColumnAlign.Right &&
                            "text-right",
                          CENTERED_COLUMN_TYPES.has(column.type) &&
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
        <EmptyState
          icon={InboxIcon}
          message={`No ${emptyLabel} to show`}
          className="border-t border-border"
        />
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
