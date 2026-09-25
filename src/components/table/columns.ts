import type { IconSvgElement } from "@hugeicons/react";
import type { ReactNode } from "react";

export enum ColumnType {
  String = "string",
  Copy = "copy",
  Date = "date",
  Boolean = "boolean",
  Enum = "enum",
  Tags = "tags",
  Buttons = "buttons",
}

export enum ColumnAlign {
  Left = "left",
  Right = "right",
}

export enum StringFilterType {
  Text = "text",
  Number = "number",
}

export type CustomTableEnumValue = {
  label: string;
  icon: IconSvgElement;
  // free string, not the narrow Color union, a fixed status badge passes a literal
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
  icon: IconSvgElement;
} & (
  | {
      type: ColumnType.String;
      monospace?: boolean;
      align?: ColumnAlign;
      // 'number' switches the filter UI from a text search to a min/max range
      filterType?: StringFilterType;
      // used for the numeric range filter/sort when getString isn't a raw parsable number (e.g. formatted currency)
      getNumber?: (item: T) => number;
      // truncates the middle instead of the end, keeping both the start and the tail visible
      truncate?: "middle";
      getString: (item: T) => string;
      // renders the value as a clickable button instead of plain text
      onClick?: (item: T) => void;
    }
  | {
      type: ColumnType.Copy;
      // opt out of the global search box, e.g. a raw url whose random path segments false-match everything
      searchable?: boolean;
      getString: (item: T) => string;
    }
  | { type: ColumnType.Date; getDate: (item: T) => Date | undefined }
  | {
      type: ColumnType.Boolean;
      getBoolean: (item: T) => boolean;
      trueIcon?: IconSvgElement;
    }
  | {
      type: ColumnType.Enum;
      enumOptions: Record<string, CustomTableEnumValue>;
      getValue: (item: T) => string | undefined;
      // optional extra detail shown in a popover when the badge is clicked, e.g. a
      // status's timestamp, most enum columns don't need this
      getPopoverContent?: (item: T) => ReactNode;
    }
  | {
      type: ColumnType.Tags;
      getTags: (item: T) => CustomTableEnumValue[];
    }
  | { type: ColumnType.Buttons; getButtons: (item: T) => ReactNode }
);

// raw, spreadsheet-friendly value for a column (dates as ISO, enums as their underlying key, tags joined by comma)
export function getColumnExportValue<T>(
  column: CustomTableColumn<T>,
  item: T,
): string {
  if (column.type === ColumnType.String || column.type === ColumnType.Copy)
    return column.getString(item);
  if (column.type === ColumnType.Date)
    return column.getDate(item)?.toISOString() ?? "";
  if (column.type === ColumnType.Boolean)
    return column.getBoolean(item) ? "true" : "false";
  if (column.type === ColumnType.Tags)
    return column
      .getTags(item)
      .map((tag) => tag.label)
      .join(", ");
  if (column.type === ColumnType.Buttons) return "";
  return column.getValue(item) ?? "";
}
