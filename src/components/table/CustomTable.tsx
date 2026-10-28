"use client";

import { InboxIcon } from "@hugeicons/core-free-icons";
import { AnimatePresence, motion, type Transition } from "motion/react";
import { type ReactNode, useEffect, useMemo, useRef } from "react";
import { EmptyState } from "@/components/EmptyState";
import { DEFAULT_SEARCH_QUERY_KEY } from "@/components/SearchBar";
import { Checkbox } from "@/shadcn/ui/checkbox";
import { Skeleton } from "@/shadcn/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/ui/table";
import { cn } from "@/shadcn/utils";
import { useIsMobile } from "@/utils/useIsMobile";
import { ActionBar } from "./ActionBar";
import { CardMenu } from "./CardMenu";
import { CustomTableCell } from "./CustomTableCell";
import { CustomTableColumnHeader } from "./CustomTableColumnHeader";
import { CustomTableSkeletonRows } from "./CustomTableSkeletonRows";
import { ColumnAlign, ColumnType, type CustomTableColumn } from "./columns";
import {
  type ColumnFilterField,
  type CustomTableSort,
  getTriState,
  isColumnFilterableOrSortable,
  type SortDirection,
} from "./filtering";
import { MobilePager } from "./MobilePager";
import { getMergeRuns } from "./mergeRuns";
import { RowCard, type RowCardContent } from "./RowCard";
import { RowContextMenu } from "./RowContextMenu";
import { useHiddenColumns } from "./useHiddenColumns";
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

const MotionTableRow = motion.create(TableRow);
const ROW_EXIT = { opacity: 0, x: -24 };
const ROW_SPRING: Transition = { type: "spring", bounce: 0.15, duration: 0.35 };

// stable empties so a table without these doesn't rerun the sort every render
const NO_SORT: NonNullable<CustomTableSort>[] = [];
const NO_PINNED_IDS: string[] = [];

// opaque mixes over the page surface, not translucent bg-x/15: the sticky
// checkbox cell repaints the row color on itself (bg-inherit) and a
// see-through one showed the other columns sliding underneath it.
// colors live in css vars so a hovered merged cell can put its first row
// back to the resting color (it's that row's child, so it'd light it up)
const ROW_COLORS = {
  selected:
    "[--row-bg:color-mix(in_oklch,var(--muted),var(--color-green-500)_15%)] [--row-hover-bg:color-mix(in_oklch,var(--muted),var(--color-green-500)_20%)]",
  pinned:
    "[--row-bg:color-mix(in_oklch,var(--muted),var(--color-amber-400)_12%)] [--row-hover-bg:color-mix(in_oklch,var(--muted),var(--color-amber-400)_17%)]",
  striped:
    "[--row-bg:color-mix(in_oklch,var(--muted),var(--foreground)_5%)] [--row-hover-bg:color-mix(in_oklch,var(--muted),var(--foreground)_9%)]",
  plain:
    "[--row-bg:var(--muted)] [--row-hover-bg:color-mix(in_oklch,var(--muted),var(--foreground)_4%)]",
};

const getRowColors = (
  isSelected: boolean,
  isPinned: boolean,
  index: number,
) => {
  if (isSelected) return ROW_COLORS.selected;
  if (isPinned) return ROW_COLORS.pinned;
  return index % 2 === 1 ? ROW_COLORS.striped : ROW_COLORS.plain;
};

const ROW_CLASS =
  "group/row bg-(--row-bg) hover:bg-(--row-hover-bg) has-[>[data-merged]:hover]:bg-(--row-bg)";
// a merged cell spans rows with different stripes, so it gets its own
// stronger grey and real borders to read as one grouped block
const MERGED_CELL_CLASS =
  "border-x border-b border-border bg-[color-mix(in_oklch,var(--muted),var(--foreground)_10%)] align-top font-medium hover:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_14%)]";

const CARD_SKELETON_KEYS = Array.from(
  { length: 6 },
  (_, i) => `card-skeleton-${i}`,
);

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
  getRowMenuItems,
  getCard,
  onOpenRow,
  getCardActions,
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
  // your own ContextMenuItems under the built in copy/select ones on right click
  getRowMenuItems?: (item: T) => ReactNode;
  // what a row looks like as a card on phones, where the columns don't fit.
  // a table without it stays a table on phones too
  getCard?: (item: T) => RowCardContent;
  // tapping a card runs this, without it a tap toggles the selection
  onOpenRow?: (item: T) => void;
  // the actions at the top of a card's three dots sheet, without it the
  // row's buttons columns show there instead
  getCardActions?: (item: T, close: () => void) => ReactNode;
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

  const { visibleColumns, hiddenCount, getHideHandler, showAllColumns } =
    useHiddenColumns(columns);
  const canResetTable =
    ((filterable || sortable) && hasActiveFilterOrSort) || hiddenCount > 0;
  const resetTable = () => {
    resetFilterAndSort();
    showAllColumns();
  };

  const sortedByColumnId = sort?.columnId ?? defaultSort[0]?.columnId;
  const mergeRuns = useMemo(
    () => getMergeRuns(visibleColumns, paginatedItems, sortedByColumnId),
    [visibleColumns, paginatedItems, sortedByColumnId],
  );
  // a leaving row still holding a tall merged cell shoves the other columns
  // sideways while it fades, so with merged cells rows just vanish
  const hasMergedCells = mergeRuns.size > 0;

  const isMobile = useIsMobile();
  const showCards = isMobile && getCard !== undefined;
  const buttonColumns = columns.filter(
    (column) => column.type === ColumnType.Buttons,
  );
  // the headers are where sorting and filtering live, a card list has none,
  // so the columns you can sort or filter become a strip of the same menus
  const controlColumns = visibleColumns.filter(
    (column) =>
      (filterable || sortable) && isColumnFilterableOrSortable(column),
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
        style={
          showCards ? undefined : { maskImage, WebkitMaskImage: maskImage }
        }
      >
        {showCards && getCard ? (
          <div className="flex flex-col gap-2 p-2">
            <div className="-mx-2 flex gap-1 overflow-x-auto px-2 pb-1">
              {controlColumns.map((column) => (
                <div key={column.id} className="shrink-0">
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
                </div>
              ))}
            </div>
            {loading &&
              CARD_SKELETON_KEYS.map((key) => (
                <Skeleton key={key} className="h-24 rounded-2xl" />
              ))}
            {!loading &&
              paginatedItems.map((item) => {
                const id = getItemId(item);
                return (
                  <RowCard
                    key={id}
                    content={getCard(item)}
                    openLabel={`${onOpenRow ? "Open" : "Select"} ${getCard(item).title}`}
                    onOpen={
                      onOpenRow
                        ? () => onOpenRow(item)
                        : selectable
                          ? () => toggleRow(id)
                          : undefined
                    }
                    className={cn(
                      selectedIds.has(id) && "border-primary bg-primary/5",
                    )}
                    leading={
                      selectable && (
                        <Checkbox
                          className="mt-1"
                          checked={selectedIds.has(id)}
                          onCheckedChange={() => toggleRow(id)}
                          onClick={(event) => event.stopPropagation()}
                          aria-label="Select row"
                        />
                      )
                    }
                    trailing={
                      <CardMenu
                        {...{ item, columns }}
                        title={getCard(item).title}
                        actions={(close) =>
                          getCardActions
                            ? getCardActions(item, close)
                            : buttonColumns.map((column) =>
                                column.type === ColumnType.Buttons ? (
                                  <span key={column.id}>
                                    {column.getButtons(item)}
                                  </span>
                                ) : null,
                              )
                        }
                      />
                    }
                  />
                );
              })}
            {!loading && (
              <MobilePager {...{ currentPage, pageCount, setPage }} />
            )}
          </div>
        ) : (
          <table className="w-full caption-bottom text-sm">
            <TableHeader>
              {/* z-20 so positioned stuff inside body cells (tag count badges,
            the sticky checkbox column) scrolls under the header, not over it */}
              <TableRow className="*:sticky *:top-0 *:z-20 *:outline *:outline-border *:text-center *:text-xs *:bg-muted *:px-1">
                {/* ! cuz the row's *:z-20 is a variant and would beat a plain z-30,
              then the other headers slid over this one when scrolling sideways */}
                {selectable && (
                  <TableHead
                    ref={checkboxColumnRef}
                    className="left-0 z-30! px-4"
                  >
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
                {visibleColumns.map((column) => (
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
                      onHide={getHideHandler(column)}
                    />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <CustomTableSkeletonRows
                  columns={visibleColumns}
                  {...{ selectable }}
                />
              )}
              {/* keyed by page so flipping pages swaps rows instantly, only rows
            that leave or join the page you're on animate */}
              <AnimatePresence key={currentPage} initial={false}>
                {!loading &&
                  paginatedItems.map((item, index) => {
                    const id = getItemId(item);
                    const isPinned = pinnedItemIds.includes(id);
                    const rowColors = getRowColors(
                      selectedIds.has(id),
                      isPinned,
                      index,
                    );
                    return (
                      <RowContextMenu
                        key={id}
                        {...{ item, columns }}
                        isSelected={selectedIds.has(id)}
                        onToggleSelected={
                          selectable ? () => toggleRow(id) : undefined
                        }
                        extraItems={getRowMenuItems?.(item)}
                      >
                        <MotionTableRow
                          layout="position"
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={hasMergedCells ? undefined : ROW_EXIT}
                          transition={ROW_SPRING}
                          className={cn(ROW_CLASS, rowColors)}
                        >
                          {selectable && (
                            <TableCell
                              className={cn(
                                "sticky left-0 z-10 border-r border-border/50 bg-inherit text-center",
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
                          {visibleColumns.map((column) => {
                            const run = mergeRuns.get(column.id)?.[index];
                            // swallowed by the tall cell of the row that started the run
                            if (run && !run.isStart) return null;
                            const isMergedCell =
                              run !== undefined && run.length > 1;
                            return (
                              <TableCell
                                key={column.id}
                                data-column-id={column.id}
                                rowSpan={isMergedCell ? run.length : undefined}
                                data-merged={isMergedCell || undefined}
                                className={cn(
                                  "border-r border-border/50 last:border-r-0",
                                  column.type === ColumnType.String &&
                                    column.align === ColumnAlign.Right &&
                                    "text-right",
                                  CENTERED_COLUMN_TYPES.has(column.type) &&
                                    "text-center",
                                  isMergedCell && MERGED_CELL_CLASS,
                                  column.getCellError?.(item) &&
                                    "bg-destructive/10 shadow-[inset_0_0_0_1px_var(--destructive)]",
                                )}
                              >
                                {isMergedCell ? (
                                  // the group name rides along under the sticky
                                  // header while you scroll through a tall group
                                  <div className="sticky top-12">
                                    <CustomTableCell {...{ column, item }} />
                                  </div>
                                ) : (
                                  <CustomTableCell {...{ column, item }} />
                                )}
                              </TableCell>
                            );
                          })}
                        </MotionTableRow>
                      </RowContextMenu>
                    );
                  })}
              </AnimatePresence>
            </TableBody>
          </table>
        )}
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
          canResetTable,
          resetTable,
          selectedItems,
          clearSelection,
          selectionActions,
          onDeleteSelected,
          columns,
          exportFilePrefix,
        }}
        selectable={Boolean(selectable)}
        showPagination={!showCards}
      />
    </div>
  );
}
