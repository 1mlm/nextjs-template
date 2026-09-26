"use client";

import {
  BrushCleaningIcon,
  Cancel01Icon,
  Delete02Icon,
  HashtagIcon,
} from "@hugeicons/core-free-icons";
import { type ReactNode, useState } from "react";
import { ConfirmButton } from "@/components/ConfirmButton";
import { Icon } from "@/components/Icon";
import { ResponsivePopover } from "@/components/ResponsivePopover";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/shadcn/ui/pagination";
import type { CustomTableColumn } from "./columns";
import { ExtractButton } from "./ExtractButton";

const clampPage = (page: number, pageCount: number) =>
  Math.min(Math.max(page, 1), pageCount);

// "Page 3 of 12" is a button: type a page number and jump straight there
function PageJumpButton({
  currentPage,
  pageCount,
  onJump,
}: {
  currentPage: number;
  pageCount: number;
  onJump: (page: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [typedPage, setTypedPage] = useState("");

  return (
    <ResponsivePopover
      {...{ open }}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (isOpen) setTypedPage(String(currentPage));
      }}
      title="Jump to page"
      icon={HashtagIcon}
      className="max-md:px-4 max-md:pb-6 md:w-auto"
      trigger={
        <button
          type="button"
          className="rounded-md px-2 py-1 text-sm whitespace-nowrap text-muted-foreground tabular-nums corner-squircle hover:bg-muted hover:text-foreground"
        >
          Page {currentPage} of {pageCount}
        </button>
      }
    >
      <form
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const page = Number(typedPage);
          if (Number.isInteger(page)) onJump(clampPage(page, pageCount));
          setOpen(false);
        }}
      >
        <Input
          inputMode="numeric"
          aria-label={`Page number, 1 to ${pageCount}`}
          autoFocus
          value={typedPage}
          onChange={(event) => setTypedPage(event.target.value)}
          className="w-24 tabular-nums max-md:flex-1"
        />
        <Button type="submit">Go</Button>
      </form>
    </ResponsivePopover>
  );
}

// the floating bar under a table: selection actions, filter reset and
// pagination. renders nothing when there's nothing to show
export function ActionBar<T>({
  currentPage,
  setPage,
  pageCount,
  canResetFilterAndSort,
  resetFilterAndSort,
  selectable,
  selectedItems,
  clearSelection,
  selectionActions,
  onDeleteSelected,
  columns,
  exportFilePrefix,
}: {
  currentPage: number;
  setPage: (page: number) => void;
  pageCount: number;
  canResetFilterAndSort: boolean;
  resetFilterAndSort: () => void;
  selectable: boolean;
  selectedItems: T[];
  clearSelection: () => void;
  selectionActions?: (items: T[]) => ReactNode;
  onDeleteSelected?: (items: T[]) => Promise<void>;
  columns: CustomTableColumn<T>[];
  exportFilePrefix: string;
}) {
  const selectedCount = selectedItems.length;
  const hasSelection = selectable && selectedCount > 0;
  if (!canResetFilterAndSort && !hasSelection && pageCount <= 1) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-30 flex flex-wrap items-center justify-end gap-2 rounded-3xl border border-border bg-sidebar px-3 py-2 shadow-[0_0_16px_rgba(0,0,0,0.35)] corner-squircle sm:inset-x-auto sm:right-8 sm:bottom-8 sm:rounded-full">
      {hasSelection && (
        <>
          <span className="flex h-9 items-center gap-1 rounded-full bg-muted pr-1 pl-3 text-sm font-medium tabular-nums corner-squircle">
            {selectedCount} selected
            <button
              type="button"
              aria-label="Clear selection"
              onClick={clearSelection}
              className="grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-background hover:text-foreground"
            >
              <Icon icon={Cancel01Icon} className="size-3.5" />
            </button>
          </span>
          {selectionActions?.(selectedItems)}
          {onDeleteSelected && (
            <ConfirmButton
              icon={Delete02Icon}
              label={`Delete ${selectedCount} ${selectedCount === 1 ? "row" : "rows"}`}
              confirmLabel="Delete"
              holdSeconds={2}
              onConfirm={async () => {
                await onDeleteSelected(selectedItems);
                clearSelection();
              }}
              trigger={
                <Button variant="destructive" className="shadow-lg">
                  <Icon icon={Delete02Icon} />
                  Delete {selectedCount}
                </Button>
              }
            />
          )}
          <ExtractButton
            {...{ selectedItems, columns }}
            filePrefix={exportFilePrefix}
          />
        </>
      )}
      {canResetFilterAndSort && (
        <Button
          variant="outline"
          className="shadow-lg"
          onClick={resetFilterAndSort}
        >
          <Icon icon={BrushCleaningIcon} />
          <span className="hidden sm:inline">Reset filters &amp; sorting</span>
          <span className="sm:hidden">Reset</span>
        </Button>
      )}
      {pageCount > 1 && (
        <Pagination className="w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                aria-disabled={currentPage === 1}
                className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
                onClick={(event) => {
                  event.preventDefault();
                  setPage(clampPage(currentPage - 1, pageCount));
                }}
              />
            </PaginationItem>
            <PaginationItem>
              <PageJumpButton
                {...{ currentPage, pageCount }}
                onJump={setPage}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                aria-disabled={currentPage === pageCount}
                className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
                onClick={(event) => {
                  event.preventDefault();
                  setPage(clampPage(currentPage + 1, pageCount));
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
