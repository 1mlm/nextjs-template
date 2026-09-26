"use client";

import {
  CheckmarkSquare01Icon,
  Copy01Icon,
  Copy02Icon,
  MouseRightClick01Icon,
  TextSelectionIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { type PointerEvent, type ReactNode, useState } from "react";
import { Icon } from "@/components/Icon";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import { copyToClipboard } from "@/utils/clipboard";
import { formatExactDate } from "@/utils/date";
import { triggerHaptic } from "@/utils/haptics";
import { ColumnType, type CustomTableColumn } from "./columns";

// the text a person would expect to paste: what the cell shows, not the raw
// export value (a readable date, the enum label, tags joined)
function getCellCopyText<T>(column: CustomTableColumn<T>, item: T) {
  if (column.type === ColumnType.String || column.type === ColumnType.Copy)
    return column.getString(item);
  if (column.type === ColumnType.Date) {
    const date = column.getDate(item);
    return date ? formatExactDate(date) : "";
  }
  if (column.type === ColumnType.Boolean)
    return column.getBoolean(item) ? "Yes" : "No";
  if (column.type === ColumnType.Enum) {
    const value = column.getValue(item);
    return value === undefined ? "" : (column.enumOptions[value]?.label ?? "");
  }
  if (column.type === ColumnType.Tags)
    return column
      .getTags(item)
      .map((tag) => tag.label)
      .join(", ");
  return "";
}

// "Name: Amina\nEmail: amina@..." for pasting a whole row into a chat
const getRowCopyText = <T,>(columns: CustomTableColumn<T>[], item: T) =>
  columns
    .filter((column) => column.type !== ColumnType.Buttons)
    .map((column) => `${column.label}: ${getCellCopyText(column, item) || "-"}`)
    .join("\n");

// typing in a cell or shift + right click keeps the browser's own menu
// (paste, spellcheck, inspect...), everywhere else gets the table's menu
const shouldUseBrowserMenu = (event: PointerEvent) =>
  event.shiftKey ||
  (event.target instanceof HTMLElement &&
    Boolean(event.target.closest("input, textarea, [contenteditable=true]")));

const truncate = (text: string, maxLength: number) =>
  text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;

// right click a row: copy what you had selected, the cell you clicked or the
// whole row, (de)select it, plus whatever the table adds. text in rows stays
// selectable so copying by hand still works too
export function RowContextMenu<T>({
  item,
  columns,
  isSelected,
  onToggleSelected,
  extraItems,
  children,
}: {
  item: T;
  columns: CustomTableColumn<T>[];
  isSelected?: boolean;
  onToggleSelected?: () => void;
  extraItems?: ReactNode;
  children: ReactNode;
}) {
  const [isBrowserMenu, setIsBrowserMenu] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [clickedColumnId, setClickedColumnId] = useState<string>();
  const clickedColumn = columns.find(({ id }) => id === clickedColumnId);
  const clickedCellText = clickedColumn
    ? getCellCopyText(clickedColumn, item)
    : "";

  const copy = (text: string) => {
    triggerHaptic("success");
    copyToClipboard(text);
  };

  const copyItems: {
    label: string;
    icon: IconSvgElement;
    text: string;
  }[] = [
    {
      label: `Copy "${truncate(selectedText, 24)}"`,
      icon: TextSelectionIcon,
      text: selectedText,
    },
    {
      label: `Copy ${clickedColumn?.label.toLowerCase() ?? "cell"}`,
      icon: Copy01Icon,
      text: clickedCellText,
    },
    {
      label: "Copy row",
      icon: Copy02Icon,
      text: getRowCopyText(columns, item),
    },
  ];
  const availableCopyItems = copyItems.filter(({ text }) => text);

  return (
    <ContextMenu>
      <ContextMenuTrigger
        asChild
        disabled={isBrowserMenu}
        className="select-text"
        // runs before the menu opens (a right press starts with pointerdown)
        onPointerDown={(event) => {
          if (event.button !== 2) return;
          setIsBrowserMenu(shouldUseBrowserMenu(event));
          setSelectedText(window.getSelection()?.toString().trim() ?? "");
          const cell =
            event.target instanceof HTMLElement
              ? event.target.closest("[data-column-id]")
              : null;
          setClickedColumnId(cell?.getAttribute("data-column-id") ?? undefined);
        }}
      >
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {availableCopyItems.map(({ label, icon, text }) => (
          <ContextMenuItem key={label} onSelect={() => copy(text)}>
            <Icon {...{ icon }} />
            <span className="truncate">{label}</span>
          </ContextMenuItem>
        ))}
        {onToggleSelected && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onSelect={onToggleSelected}>
              <Icon icon={CheckmarkSquare01Icon} />
              {isSelected ? "Deselect row" : "Select row"}
            </ContextMenuItem>
          </>
        )}
        {extraItems && (
          <>
            <ContextMenuSeparator />
            {extraItems}
          </>
        )}
        <ContextMenuSeparator />
        <ContextMenuLabel className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground pointer-coarse:hidden">
          <Icon icon={MouseRightClick01Icon} className="size-3.5" />
          shift + right click: browser menu
        </ContextMenuLabel>
      </ContextMenuContent>
    </ContextMenu>
  );
}
