"use client";

import { InboxIcon } from "@hugeicons/core-free-icons";
import { type ReactNode, useEffect, useMemo, useRef } from "react";
import { EmptyState } from "@/components/EmptyState";
import { DEFAULT_SEARCH_QUERY_KEY } from "@/components/SearchBar";
import { Checkbox } from "@/shadcn/ui/checkbox";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/ui/table";
import { cn } from "@/shadcn/utils";
import { ActionBar } from "./ActionBar";
import { CustomTableCell } from "./CustomTableCell";
import { CustomTableColumnHeader } from "./CustomTableColumnHeader";
import { CustomTableSkeletonRows } from "./CustomTableSkeletonRows";
import { ColumnAlign, ColumnType, type CustomTableColumn } from "./columns";
import {
  type ColumnFilterField,
  type CustomTableSort,
  getTriState,
  type SortDirection,
} from "./filtering";
import { getMergeRuns } from "./mergeRuns";
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

// stable empties so a table without these doesn't rerun the sort every render
const NO_SORT: NonNullable<CustomTableSort>[] = [];
const NO_PINNED_IDS: string[] = [];

// opaque mixes over the page surface, not translucent bg-x/15: the sticky
// checkbox cell repaints the row color on itself and a see-through one showed
// the other columns sliding underneath it
const ROW_BACKGROUNDS = {
  selected: "bg-[color-mix(in_oklch,var(--muted),var(--color-green-500)_15%)]",
  pinned: "bg-[color-mix(in_oklch,var(--muted),var(--color-amber-400)_12%)]",
  striped: "bg-[color-mix(in_oklch,var(--muted),var(--foreground)_5%)]",
  plain: "bg-muted",
};

const getRowBackground = (
  isSelected: boolean,
  isPinned: boolean,
  index: number,
) => {
  if (isSelected) return ROW_BACKGROUNDS.selected;
  if (isPinned) return ROW_BACKGROUNDS.pinned;
  return index % 2 === 1 ? ROW_BACKGROUNDS.striped : ROW_BACKGROUNDS.plain;
};

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
  defaultSort = NO_SORT,
  pinnedItemIds = NO_PINNED_IDS,
  selectionActions,
  onDeleteSelected,
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
  // tie breakers applied in order while the user hasn't picked a sort, and
  // not counted as a sort for the reset button. what mergeAdjacent needs
  defaultSort?: NonNullable<CustomTableSort>[];
  // kept on top with a highlight in this order, e.g. useJustCreatedIds
  pinnedItemIds?: string[];
  // your own buttons in the action bar, only shown while rows are selected
  selectionActions?: (items: T[]) => ReactNode;
  // adds a confirm-gated bulk delete, throw to show an error in the confirm
  onDeleteSelected?: (items: T[]) => Promise<void>;
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
    defaultSort,
    pinnedItemIds,
    getItemId,
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
  // a newly pinned row lands on page 1, so jump there too
  const filterSortKey = JSON.stringify([
    search,
    filterValues,
    sortRaw,
    pinnedItemIds,
  ]);
  const lastFilterSortKeyRef = useRef(filterSortKey);
  useEffect(() => {
    if (lastFilterSortKeyRef.current === filterSortKey) return;
    lastFilterSortKeyRef.current = filterSortKey;
    setPage(1);
  }, [filterSortKey, setPage]);

  const {
    selectedIds,
    clearSelection,
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

  const mergeRuns = useMemo(
    () => getMergeRuns(columns, paginatedItems),
    [columns, paginatedItems],
  );

  const { scrollContainerRef, checkboxColumnRef, maskImage } = useScrollFade(
    paginatedItems.length,
  );

  return (
    <div className="rounded-md overflow-clip">
      <div
        ref={scrollContainerRef}
        // fills the screen minus room for the page header above and the
        // floating action bar below, instead of a fixed 70vh that left a gap
        className="relative w-full max-h-[calc(100dvh-12rem)] overflow-auto"
        style={{ maskImage, WebkitMaskImage: maskImage }}
      >
        <table className="w-full caption-bottom text-sm">
          <TableHeader>
            {/* z-20 so positioned stuff inside body cells (tag count badges,
            the sticky checkbox column) scrolls under the header, not over it */}
            <TableRow className="*:sticky *:top-0 *:z-20 *:outline *:outline-border *:text-center *:text-xs *:bg-muted *:px-1">
              {selectable && (
                <TableHead ref={checkboxColumnRef} className="left-0 z-30 px-4">
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
                const isPinned = pinnedItemIds.includes(id);
                const rowBackground = getRowBackground(
                  selectedIds.has(id),
                  isPinned,
                  index,
                );
                return (
                  <TableRow
                    key={id}
                    className={cn(
                      "group/row",
                      rowBackground,
                      isPinned && "animate-in fade-in-0 duration-500",
                    )}
                  >
                    {selectable && (
                      <TableCell
                        className={cn(
                          "sticky left-0 z-10 border-r border-border/50 text-center",
                          rowBackground,
                        )}
                      >
                        <div className="flex justify-center pr-2!">
                          <Checkbox
                            checked={selectedIds.has(id)}
                            onCheckedChange={() => toggleRow(id)}
                            aria-label="Select row"
                          />
                        </div>
                      </TableCell>
                    )}
                    {columns.map((column) => {
                      const run = mergeRuns.get(column.id)?.[index];
                      // swallowed by the tall cell of the row that started the run
                      if (run && !run.isStart) return null;
                      const isMergedCell = run !== undefined && run.length > 1;
                      return (
                        <TableCell
                          key={column.id}
                          rowSpan={isMergedCell ? run.length : undefined}
                          className={cn(
                            "border-r border-border/50 last:border-r-0",
                            column.type === ColumnType.String &&
                              column.align === ColumnAlign.Right &&
                              "text-right",
                            CENTERED_COLUMN_TYPES.has(column.type) &&
                              "text-center",
                            isMergedCell &&
                              "border-b border-b-border bg-muted/60 align-top font-medium",
                            column.getCellError?.(item) &&
                              "bg-destructive/10 shadow-[inset_0_0_0_1px_var(--destructive)]",
                          )}
                        >
                          <CustomTableCell {...{ column, item }} />
                        </TableCell>
                      );
                    })}
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
      <ActionBar
        {...{
          currentPage,
          setPage,
          pageCount,
          canResetFilterAndSort,
          resetFilterAndSort,
          selectedItems,
          clearSelection,
          selectionActions,
          onDeleteSelected,
          columns,
          exportFilePrefix,
        }}
        selectable={Boolean(selectable)}
      />
    </div>
  );
}
