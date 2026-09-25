"use client";

import {
  ArrowDown01Icon,
  ArrowUp10Icon,
  Cancel01Icon,
  CheckIcon,
  FilterIcon,
  Sorting01Icon,
  SortingAZ02Icon,
  SortingZA01Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import {
  endOfYesterday,
  formatISO,
  parseISO,
  startOfMonth,
  startOfToday,
  startOfWeek,
  startOfYesterday,
  subHours,
} from "date-fns";
import { type ReactNode, useId } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
import { Calendar } from "@/shadcn/ui/calendar";
import { Checkbox } from "@/shadcn/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import { Input } from "@/shadcn/ui/input";
import { cn } from "@/shadcn/utils";
import { toggleListItem } from "@/utils/array";
import { EnumBadge } from "./CustomTableCell";
import {
  ColumnType,
  type CustomTableColumn,
  StringFilterType,
} from "./columns";
import {
  ColumnFilterField,
  ENUM_FILTER_NONE_KEY,
  type GetFilterField,
  getColumnFilterFields,
  getTriState,
  isColumnFilterableOrSortable,
  isEnumOptionExcluded,
  type SetFilterField,
  SortDirection,
  splitList,
  toggleEnumOption,
} from "./filtering";

// one consistent checkbox+label row, reused by every filter menu (enum options, "select all", tag picks...)
function CheckboxRow({
  checked,
  onCheckedChange,
  children,
}: {
  checked: boolean | "indeterminate";
  onCheckedChange: () => void;
  children: ReactNode;
}) {
  const id = useId();

  return (
    <label
      htmlFor={id}
      className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
    >
      <Checkbox {...{ id, checked, onCheckedChange }} />
      {children}
    </label>
  );
}

function SelectAllRow({
  selectedCount,
  totalCount,
  onToggle,
}: {
  selectedCount: number;
  totalCount: number;
  onToggle: () => void;
}) {
  return (
    <CheckboxRow
      checked={getTriState(selectedCount, totalCount)}
      onCheckedChange={onToggle}
    >
      Select all
    </CheckboxRow>
  );
}

// two number inputs sharing one min/max filter pair
function MinMaxInputs({
  getField,
  setField,
  minField = ColumnFilterField.Min,
  maxField = ColumnFilterField.Max,
  className = "h-7 w-20",
  showToLabel = false,
}: {
  getField: GetFilterField;
  setField: SetFilterField;
  minField?: ColumnFilterField;
  maxField?: ColumnFilterField;
  className?: string;
  showToLabel?: boolean;
}) {
  return (
    <>
      <Input
        type="number"
        placeholder="Min"
        value={getField(minField)}
        onChange={(e) => setField(minField, e.target.value)}
        {...{ className }}
      />
      {showToLabel && <span className="text-muted-foreground text-xs">to</span>}
      <Input
        type="number"
        placeholder="Max"
        value={getField(maxField)}
        onChange={(e) => setField(maxField, e.target.value)}
        {...{ className }}
      />
    </>
  );
}

function IconLabel({
  icon,
  className,
  children,
}: {
  icon: IconSvgElement;
  className: string;
  children: ReactNode;
}) {
  return (
    <>
      <Icon {...{ icon }} className={cn("size-3.5", className)} />
      <span className="text-sm">{children}</span>
    </>
  );
}

type ExcludedFilterOption = { key: string; label: ReactNode };

const getEnumFilterOptions = <T,>(
  column: Extract<CustomTableColumn<T>, { type: ColumnType.Enum }>,
): ExcludedFilterOption[] => [
  ...Object.entries(column.enumOptions).map(([key, value]) => ({
    key,
    label: <EnumBadge {...{ value }} />,
  })),
  {
    key: ENUM_FILTER_NONE_KEY,
    label: (
      <IconLabel icon={Cancel01Icon} className="opacity-50">
        No value
      </IconLabel>
    ),
  },
];

const BOOLEAN_FILTER_OPTIONS: ExcludedFilterOption[] = [
  {
    key: "true",
    label: (
      <IconLabel icon={CheckIcon} className="text-green-500">
        Yes
      </IconLabel>
    ),
  },
  {
    key: "false",
    label: (
      <IconLabel icon={Cancel01Icon} className="opacity-50">
        No
      </IconLabel>
    ),
  },
];

// enums and booleans both filter by excluding keys, they just feed different options in
function ExcludedOptionsFilterContent({
  options,
  getField,
  setField,
}: {
  options: ExcludedFilterOption[];
  getField: GetFilterField;
  setField: SetFilterField;
}) {
  const keys = options.map((option) => option.key);
  const includedCount = keys.filter(
    (key) => !isEnumOptionExcluded(getField, key),
  ).length;
  const toggleAll = () =>
    setField(
      ColumnFilterField.Excluded,
      includedCount === keys.length ? keys.join(",") : "",
    );

  return (
    <div className="flex flex-col gap-1 p-1">
      <SelectAllRow
        selectedCount={includedCount}
        totalCount={keys.length}
        onToggle={toggleAll}
      />
      <DropdownMenuSeparator />
      {options.map(({ key, label }) => (
        <CheckboxRow
          key={key}
          checked={!isEnumOptionExcluded(getField, key)}
          onCheckedChange={() =>
            setField(
              ColumnFilterField.Excluded,
              toggleEnumOption(getField, key),
            )
          }
        >
          {label}
        </CheckboxRow>
      ))}
    </div>
  );
}

const DATE_PRESETS: { label: string; getRange: () => [Date, Date] }[] = [
  { label: "Last hour", getRange: () => [subHours(new Date(), 1), new Date()] },
  { label: "Today", getRange: () => [startOfToday(), new Date()] },
  {
    label: "Yesterday",
    getRange: () => [startOfYesterday(), endOfYesterday()],
  },
  {
    label: "This week",
    getRange: () => [startOfWeek(new Date(), { weekStartsOn: 1 }), new Date()],
  },
  {
    label: "This month",
    getRange: () => [startOfMonth(new Date()), new Date()],
  },
];

function DateRangeFilterContent({
  getField,
  setField,
}: {
  getField: GetFilterField;
  setField: SetFilterField;
}) {
  const from = getField(ColumnFilterField.From);
  const to = getField(ColumnFilterField.To);

  return (
    <div className="flex flex-col gap-1 p-1">
      <div className="flex flex-wrap gap-1 px-1 pb-1">
        {DATE_PRESETS.map((preset) => (
          <Button
            key={preset.label}
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => {
              const [start, end] = preset.getRange();
              setField(ColumnFilterField.From, start.toISOString());
              setField(ColumnFilterField.To, end.toISOString());
            }}
          >
            {preset.label}
          </Button>
        ))}
      </div>
      <Calendar
        mode="range"
        selected={{
          from: from ? parseISO(from) : undefined,
          to: to ? parseISO(to) : undefined,
        }}
        onSelect={(range) => {
          setField(
            ColumnFilterField.From,
            range?.from
              ? formatISO(range.from, { representation: "date" })
              : "",
          );
          setField(
            ColumnFilterField.To,
            range?.to ? formatISO(range.to, { representation: "date" }) : "",
          );
        }}
      />
      {(from || to) && (
        <Button
          variant="ghost"
          size="sm"
          className="justify-start"
          onClick={() => {
            setField(ColumnFilterField.From, "");
            setField(ColumnFilterField.To, "");
          }}
        >
          <Icon icon={Cancel01Icon} />
          Clear
        </Button>
      )}
    </div>
  );
}

function NumberRangeFilterContent({
  getField,
  setField,
}: {
  getField: GetFilterField;
  setField: SetFilterField;
}) {
  return (
    <div className="flex items-center gap-1.5 p-2">
      <MinMaxInputs {...{ getField, setField }} showToLabel />
    </div>
  );
}

function TextFilterContent({
  getField,
  setField,
}: {
  getField: GetFilterField;
  setField: SetFilterField;
}) {
  return (
    <div className="p-2">
      <Input
        placeholder="Search..."
        value={getField(ColumnFilterField.Search)}
        onChange={(e) => setField(ColumnFilterField.Search, e.target.value)}
        className="h-7"
      />
    </div>
  );
}

function TagsFilterContent<T>({
  column,
  items,
  getField,
  setField,
}: {
  column: Extract<CustomTableColumn<T>, { type: ColumnType.Tags }>;
  items: T[];
  getField: GetFilterField;
  setField: SetFilterField;
}) {
  const only = splitList(getField(ColumnFilterField.Only));
  const allLabels = [
    ...new Set(
      items.flatMap((item) => column.getTags(item).map((tag) => tag.label)),
    ),
  ];
  const toggleAll = () =>
    setField(
      ColumnFilterField.Only,
      only.length === allLabels.length ? "" : allLabels.join(","),
    );
  const toggleLabel = (label: string) =>
    setField(ColumnFilterField.Only, toggleListItem(only, label).join(","));

  return (
    <div className="flex flex-col gap-1 p-1">
      <div className="flex items-center gap-1.5 p-1">
        <span className="text-muted-foreground text-xs">Count</span>
        <MinMaxInputs
          {...{ getField, setField }}
          minField={ColumnFilterField.CountMin}
          maxField={ColumnFilterField.CountMax}
          className="h-7 w-16"
        />
      </div>
      <DropdownMenuSeparator />
      <div className="p-1">
        <Input
          placeholder="Search tags..."
          value={getField(ColumnFilterField.Search)}
          onChange={(e) => setField(ColumnFilterField.Search, e.target.value)}
          className="h-7"
        />
      </div>
      <DropdownMenuSeparator />
      <SelectAllRow
        selectedCount={only.length}
        totalCount={allLabels.length}
        onToggle={toggleAll}
      />
      <DropdownMenuSeparator />
      <div className="flex max-h-48 flex-col gap-0.5 overflow-y-auto p-1">
        {allLabels.map((label) => (
          <CheckboxRow
            key={label}
            checked={only.includes(label)}
            onCheckedChange={() => toggleLabel(label)}
          >
            {label}
          </CheckboxRow>
        ))}
      </div>
    </div>
  );
}

// numeric columns sort with an up/down-digit icon, everything else with an A-Z/Z-A icon
const SORT_ICONS: Record<
  SortDirection,
  { numeric: IconSvgElement; text: IconSvgElement }
> = {
  [SortDirection.Asc]: { numeric: ArrowDown01Icon, text: SortingAZ02Icon },
  [SortDirection.Desc]: { numeric: ArrowUp10Icon, text: SortingZA01Icon },
};

const getSortIcon = (dir: SortDirection, numeric: boolean) =>
  SORT_ICONS[dir][numeric ? "numeric" : "text"];

const SORT_OPTIONS: { dir: SortDirection; label: string }[] = [
  { dir: SortDirection.Asc, label: "Ascending" },
  { dir: SortDirection.Desc, label: "Descending" },
];

function SortSubmenuContent({
  numeric,
  sort,
  onSortChange,
}: {
  numeric: boolean;
  sort: SortDirection | null;
  onSortChange: (dir: SortDirection | null) => void;
}) {
  return (
    <>
      {SORT_OPTIONS.map(({ dir, label }) => (
        <DropdownMenuItem key={dir} onClick={() => onSortChange(dir)}>
          <Icon icon={getSortIcon(dir, numeric)} />
          {label}
          {sort === dir && (
            <span className="ml-auto text-muted-foreground text-xs">✓</span>
          )}
        </DropdownMenuItem>
      ))}
      {sort && (
        <DropdownMenuItem onClick={() => onSortChange(null)}>
          <Icon icon={Cancel01Icon} />
          Clear sort
        </DropdownMenuItem>
      )}
    </>
  );
}

export function CustomTableColumnHeader<T>({
  column,
  items,
  filterable = true,
  sortable = true,
  getField,
  setField,
  sort,
  onSortChange,
}: {
  column: CustomTableColumn<T>;
  items: T[];
  filterable?: boolean;
  sortable?: boolean;
  getField: GetFilterField;
  setField: SetFilterField;
  sort: SortDirection | null;
  onSortChange: (dir: SortDirection | null) => void;
}) {
  const columnEligible = isColumnFilterableOrSortable(column);
  const canFilter = filterable && columnEligible;
  const canSort = sortable && columnEligible;
  const fields = getColumnFilterFields(column);
  const hasActiveFilter = canFilter && fields.some((field) => getField(field));
  const numeric =
    column.type === ColumnType.String &&
    column.filterType === StringFilterType.Number;

  const label = (
    <span
      className={cn(
        "inline-flex items-center justify-center gap-1.5",
        (canFilter || canSort) && "transition-colors hover:text-foreground/70",
      )}
    >
      <Icon icon={column.icon} />
      {column.label}
      {hasActiveFilter && (
        <Icon
          icon={FilterIcon}
          fill="currentColor"
          className="size-3 text-primary"
        />
      )}
      {sort && (
        <Icon
          icon={getSortIcon(sort, numeric)}
          className="size-3 text-primary"
        />
      )}
    </span>
  );

  if (!canFilter && !canSort)
    return <span className="inline-flex">{label}</span>;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button">{label}</button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-40">
        {canFilter && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icon icon={FilterIcon} />
              Filter
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent
                className={cn(
                  column.type !== ColumnType.String &&
                    column.type !== ColumnType.Tags &&
                    "w-56",
                )}
              >
                {column.type === ColumnType.Enum && (
                  <ExcludedOptionsFilterContent
                    options={getEnumFilterOptions(column)}
                    {...{ getField, setField }}
                  />
                )}
                {column.type === ColumnType.Date && (
                  <DateRangeFilterContent {...{ getField, setField }} />
                )}
                {column.type === ColumnType.String &&
                  column.filterType === StringFilterType.Number && (
                    <NumberRangeFilterContent {...{ getField, setField }} />
                  )}
                {column.type === ColumnType.String &&
                  column.filterType !== StringFilterType.Number && (
                    <TextFilterContent {...{ getField, setField }} />
                  )}
                {column.type === ColumnType.Tags && (
                  <TagsFilterContent
                    {...{ column, items, getField, setField }}
                  />
                )}
                {column.type === ColumnType.Boolean && (
                  <ExcludedOptionsFilterContent
                    options={BOOLEAN_FILTER_OPTIONS}
                    {...{ getField, setField }}
                  />
                )}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        )}
        {canSort && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icon icon={Sorting01Icon} />
              Sort
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <SortSubmenuContent {...{ numeric, sort, onSortChange }} />
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
