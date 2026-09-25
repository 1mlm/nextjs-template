import { addDays, parseISO } from "date-fns";
import { toggleListItem } from "@/utils/array";
import {
  ColumnType,
  type CustomTableColumn,
  type CustomTableEnumValue,
  StringFilterType,
} from "./columns";

// sentinel used inside enum filters to represent "no value set" as its own selectable option
export const ENUM_FILTER_NONE_KEY = "__none__";

export enum SortDirection {
  Asc = "asc",
  Desc = "desc",
}
export type CustomTableSort = { columnId: string; dir: SortDirection } | null;

const isSortDirection = (value: string | undefined): value is SortDirection =>
  Object.values<string>(SortDirection).includes(value ?? "");

export function parseSort(raw: string | null): CustomTableSort {
  if (!raw) return null;
  const [columnId, dir] = raw.split(":");
  if (!columnId || !isSortDirection(dir)) return null;
  return { columnId, dir };
}

export function serializeSort(sort: CustomTableSort): string {
  return sort ? `${sort.columnId}:${sort.dir}` : "";
}

// the named sub-values a column's filter can be made of, only some apply depending on column type
export enum ColumnFilterField {
  Excluded = "excluded",
  Search = "search",
  Min = "min",
  Max = "max",
  From = "from",
  To = "to",
  Only = "only",
  CountMin = "countMin",
  CountMax = "countMax",
}

// human readable query param per field, e.g. excluded_role, createdAt_from, tags_count_min
export function getFilterKey(
  columnId: string,
  field: ColumnFilterField,
): string {
  if (field === ColumnFilterField.Excluded) return `excluded_${columnId}`;
  if (field === ColumnFilterField.CountMin) return `${columnId}_count_min`;
  if (field === ColumnFilterField.CountMax) return `${columnId}_count_max`;
  return `${columnId}_${field}`;
}

export function getColumnFilterFields<T>(
  column: CustomTableColumn<T>,
): ColumnFilterField[] {
  if (column.type === ColumnType.Enum || column.type === ColumnType.Boolean)
    return [ColumnFilterField.Excluded];
  if (column.type === ColumnType.Date)
    return [ColumnFilterField.From, ColumnFilterField.To];
  if (column.type === ColumnType.Tags)
    return [
      ColumnFilterField.Search,
      ColumnFilterField.Only,
      ColumnFilterField.CountMin,
      ColumnFilterField.CountMax,
    ];
  if (column.type === ColumnType.String)
    return column.filterType === StringFilterType.Number
      ? [ColumnFilterField.Min, ColumnFilterField.Max]
      : [ColumnFilterField.Search];
  return [];
}

export type GetFilterField = (field: ColumnFilterField) => string;
export type SetFilterField = (field: ColumnFilterField, value: string) => void;

export const splitList = (value: string) => value.split(",").filter(Boolean);

export function isEnumOptionExcluded(
  getField: GetFilterField,
  key: string,
): boolean {
  return splitList(getField(ColumnFilterField.Excluded)).includes(key);
}

export function toggleEnumOption(
  getField: GetFilterField,
  key: string,
): string {
  return toggleListItem(
    splitList(getField(ColumnFilterField.Excluded)),
    key,
  ).join(",");
}

// enums and booleans share this, booleans just use the keys "true"/"false"
function excludedMatches(getField: GetFilterField, key: string): boolean {
  return !splitList(getField(ColumnFilterField.Excluded)).includes(key);
}

function numberMatches(min: string, max: string, value: number): boolean {
  if (min && value < Number(min)) return false;
  if (max && value > Number(max)) return false;
  return true;
}

const isDateOnly = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

function dateMatches(
  from: string,
  to: string,
  value: Date | undefined,
): boolean {
  if (!from && !to) return true;
  if (!value) return false;
  const time = value.getTime();
  if (from && time < parseISO(from).getTime()) return false;
  // a date-only "to" (calendar day pick) is inclusive of the whole day, a precise preset timestamp is exact
  const toBound =
    to && (isDateOnly(to) ? addDays(parseISO(to), 1) : parseISO(to)).getTime();
  if (toBound && time >= toBound) return false;
  return true;
}

function textMatches(search: string, value: string): boolean {
  if (!search) return true;
  return value.toLowerCase().includes(search.toLowerCase());
}

function tagsMatches(
  getField: GetFilterField,
  tags: CustomTableEnumValue[],
): boolean {
  const countMin = getField(ColumnFilterField.CountMin);
  const countMax = getField(ColumnFilterField.CountMax);
  if (countMin && tags.length < Number(countMin)) return false;
  if (countMax && tags.length > Number(countMax)) return false;

  const only = splitList(getField(ColumnFilterField.Only));
  if (only.length > 0) return tags.some((tag) => only.includes(tag.label));

  const search = getField(ColumnFilterField.Search);
  if (!search) return true;
  const query = search.toLowerCase();
  return tags.some((tag) =>
    [tag.label, ...(tag.keywords ?? [])].some((value) =>
      value.toLowerCase().includes(query),
    ),
  );
}

// whether a column supports filtering/sorting at all (copy/buttons columns are excluded)
export function isColumnFilterableOrSortable<T>(
  column: CustomTableColumn<T>,
): boolean {
  return column.type !== ColumnType.Copy && column.type !== ColumnType.Buttons;
}

// checked/unchecked/indeterminate for a "select all" checkbox given how many of a set are selected
export function getTriState(
  selectedCount: number,
  totalCount: number,
): boolean | "indeterminate" {
  if (selectedCount === 0) return false;
  return selectedCount === totalCount ? true : "indeterminate";
}

function getColumnNumber<T>(
  column: Extract<CustomTableColumn<T>, { type: ColumnType.String }>,
  item: T,
): number {
  return column.getNumber
    ? column.getNumber(item)
    : Number(column.getString(item));
}

export function columnMatchesFilter<T>(
  column: CustomTableColumn<T>,
  item: T,
  getField: GetFilterField,
): boolean {
  if (column.type === ColumnType.String) {
    return column.filterType === StringFilterType.Number
      ? numberMatches(
          getField(ColumnFilterField.Min),
          getField(ColumnFilterField.Max),
          getColumnNumber(column, item),
        )
      : textMatches(getField(ColumnFilterField.Search), column.getString(item));
  }
  if (column.type === ColumnType.Date)
    return dateMatches(
      getField(ColumnFilterField.From),
      getField(ColumnFilterField.To),
      column.getDate(item),
    );
  if (column.type === ColumnType.Enum)
    return excludedMatches(
      getField,
      column.getValue(item) ?? ENUM_FILTER_NONE_KEY,
    );
  if (column.type === ColumnType.Tags)
    return tagsMatches(getField, column.getTags(item));
  if (column.type === ColumnType.Boolean)
    return excludedMatches(getField, String(column.getBoolean(item)));
  return true;
}

export function compareColumnValues<T>(
  column: CustomTableColumn<T>,
  a: T,
  b: T,
): number {
  if (column.type === ColumnType.String) {
    if (column.filterType === StringFilterType.Number)
      return getColumnNumber(column, a) - getColumnNumber(column, b);
    return column.getString(a).localeCompare(column.getString(b));
  }
  if (column.type === ColumnType.Date) {
    const aTime = column.getDate(a)?.getTime() ?? -Infinity;
    const bTime = column.getDate(b)?.getTime() ?? -Infinity;
    return aTime - bTime;
  }
  if (column.type === ColumnType.Enum) {
    const aValue = column.getValue(a) ?? "";
    const bValue = column.getValue(b) ?? "";
    return aValue.localeCompare(bValue);
  }
  if (column.type === ColumnType.Tags)
    return column.getTags(a).length - column.getTags(b).length;
  if (column.type === ColumnType.Boolean)
    return Number(column.getBoolean(a)) - Number(column.getBoolean(b));
  return 0;
}
