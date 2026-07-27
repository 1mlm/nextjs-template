import type { CustomTableColumn, CustomTableEnumValue } from "./CustomTable";

// sentinel used inside enum filters to represent "no value set" as its own selectable option
export const ENUM_FILTER_NONE_KEY = "__none__";

export type CustomTableSort = { columnId: string; dir: "asc" | "desc" } | null;

export function parseSort(raw: string | null): CustomTableSort {
  if (!raw) return null;
  const [columnId, dir] = raw.split(":");
  if (!columnId || (dir !== "asc" && dir !== "desc")) return null;
  return { columnId, dir };
}

export function serializeSort(sort: CustomTableSort): string {
  return sort ? `${sort.columnId}:${sort.dir}` : "";
}

// the named sub-values a column's filter can be made of, only some apply depending on column type
export type ColumnFilterField =
  | "excluded"
  | "search"
  | "min"
  | "max"
  | "from"
  | "to"
  | "only"
  | "countMin"
  | "countMax";

// human readable query param per field, e.g. excluded_role, createdAt_from, tags_count_min
export function getFilterKey(
  columnId: string,
  field: ColumnFilterField,
): string {
  if (field === "excluded") return `excluded_${columnId}`;
  if (field === "countMin") return `${columnId}_count_min`;
  if (field === "countMax") return `${columnId}_count_max`;
  return `${columnId}_${field}`;
}

export function getColumnFilterFields<T>(
  column: CustomTableColumn<T>,
): ColumnFilterField[] {
  if (column.type === "enum" || column.type === "boolean") return ["excluded"];
  if (column.type === "date") return ["from", "to"];
  if (column.type === "tags") return ["search", "only", "countMin", "countMax"];
  if (column.type === "string")
    return column.filterType === "number" ? ["min", "max"] : ["search"];
  return [];
}

export type GetFilterField = (field: ColumnFilterField) => string;

const splitList = (value: string) =>
  value ? value.split(",").filter(Boolean) : [];

export function isEnumOptionExcluded(
  getField: GetFilterField,
  key: string,
): boolean {
  return splitList(getField("excluded")).includes(key);
}

export function toggleEnumOption(
  getField: GetFilterField,
  key: string,
): string {
  const excluded = new Set(splitList(getField("excluded")));
  if (excluded.has(key)) excluded.delete(key);
  else excluded.add(key);
  return [...excluded].join(",");
}

function enumMatches(
  getField: GetFilterField,
  value: string | undefined,
): boolean {
  const excluded = splitList(getField("excluded"));
  if (excluded.length === 0) return true;
  return !excluded.includes(value ?? ENUM_FILTER_NONE_KEY);
}

// same "excluded" mechanism as enums, just fixed to the two keys "true"/"false"
function booleanMatches(getField: GetFilterField, value: boolean): boolean {
  const excluded = splitList(getField("excluded"));
  if (excluded.length === 0) return true;
  return !excluded.includes(String(value));
}

function numberMatches(min: string, max: string, value: number): boolean {
  if (min && value < Number(min)) return false;
  if (max && value > Number(max)) return false;
  return true;
}

export const DAY_MS = 86_400_000;
const isDateOnly = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

function dateMatches(
  from: string,
  to: string,
  value: Date | undefined,
): boolean {
  if (!from && !to) return true;
  if (!value) return false;
  const time = value.getTime();
  if (from && time < new Date(from).getTime()) return false;
  // a date-only "to" (calendar day pick) is inclusive of the whole day, a precise preset timestamp is exact
  const toBound = to && new Date(to).getTime() + (isDateOnly(to) ? DAY_MS : 0);
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
  const countMin = getField("countMin");
  const countMax = getField("countMax");
  if (countMin && tags.length < Number(countMin)) return false;
  if (countMax && tags.length > Number(countMax)) return false;

  const only = splitList(getField("only"));
  if (only.length > 0) return tags.some((tag) => only.includes(tag.label));

  const search = getField("search");
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
  return column.type !== "copy" && column.type !== "buttons";
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
  column: Extract<CustomTableColumn<T>, { type: "string" }>,
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
  if (column.type === "string") {
    return column.filterType === "number"
      ? numberMatches(
          getField("min"),
          getField("max"),
          getColumnNumber(column, item),
        )
      : textMatches(getField("search"), column.getString(item));
  }
  if (column.type === "date")
    return dateMatches(getField("from"), getField("to"), column.getDate(item));
  if (column.type === "enum")
    return enumMatches(getField, column.getValue(item));
  if (column.type === "tags")
    return tagsMatches(getField, column.getTags(item));
  if (column.type === "boolean")
    return booleanMatches(getField, column.getBoolean(item));
  return true;
}

export function compareColumnValues<T>(
  column: CustomTableColumn<T>,
  a: T,
  b: T,
): number {
  if (column.type === "string") {
    if (column.filterType === "number")
      return getColumnNumber(column, a) - getColumnNumber(column, b);
    return column.getString(a).localeCompare(column.getString(b));
  }
  if (column.type === "date") {
    const aTime = column.getDate(a)?.getTime() ?? -Infinity;
    const bTime = column.getDate(b)?.getTime() ?? -Infinity;
    return aTime - bTime;
  }
  if (column.type === "enum") {
    const aValue = column.getValue(a) ?? "";
    const bValue = column.getValue(b) ?? "";
    return aValue.localeCompare(bValue);
  }
  if (column.type === "tags")
    return column.getTags(a).length - column.getTags(b).length;
  if (column.type === "boolean")
    return Number(column.getBoolean(a)) - Number(column.getBoolean(b));
  return 0;
}
