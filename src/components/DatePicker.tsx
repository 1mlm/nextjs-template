"use client";

import { Calendar03Icon } from "@hugeicons/core-free-icons";
import { format, set, setHours, setMinutes, startOfDay } from "date-fns";
import { type ReactNode, useEffect, useRef, useState } from "react";
import type { DateRange } from "react-day-picker";
import { Icon } from "@/components/Icon";
import { ResponsivePopover } from "@/components/ResponsivePopover";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";
import { Button } from "@/shadcn/ui/button";
import { Calendar } from "@/shadcn/ui/calendar";
import { cn } from "@/shadcn/utils";

// bigger cells in the phone sheet, thumbs aren't cursors
const CALENDAR_CLASS =
  "[--cell-size:--spacing(10)] md:[--cell-size:--spacing(8)]";

const HOURS_12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const HOURS_24 = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const WHEEL_ITEM_HEIGHT_PX = 32;

const padTwoDigits = (n: number) => String(n).padStart(2, "0");

function PickerPopover({
  title,
  label,
  placeholder,
  open,
  onOpenChange,
  children,
}: {
  title: string;
  label?: string;
  placeholder: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <ResponsivePopover
      {...{ title, open, onOpenChange }}
      align="start"
      className="flex w-auto justify-center px-4 pt-1 pb-6 md:p-1"
      trigger={
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start font-normal",
            !label && "text-muted-foreground",
          )}
        >
          <Icon icon={Calendar03Icon} />
          {label ?? placeholder}
        </Button>
      }
    >
      {children}
    </ResponsivePopover>
  );
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
}: {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const label = value && format(value, "PPP");

  return (
    <PickerPopover
      title="Pick a date"
      onOpenChange={setOpen}
      {...{ label, placeholder, open }}
    >
      <Calendar
        mode="single"
        className={CALENDAR_CLASS}
        selected={value}
        defaultMonth={value}
        onSelect={(date) => {
          onChange(date);
          setOpen(false);
        }}
      />
    </PickerPopover>
  );
}

function formatDateRange({ from, to }: DateRange) {
  if (!from) return undefined;
  const start = format(from, "LLL dd, y");
  return to ? `${start} - ${format(to, "LLL dd, y")}` : start;
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Pick a date range",
}: {
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
  placeholder?: string;
}) {
  const isMobile = useIsMobile();
  const label = value && formatDateRange(value);

  return (
    <PickerPopover title="Pick a date range" {...{ label, placeholder }}>
      <Calendar
        mode="range"
        className={CALENDAR_CLASS}
        numberOfMonths={isMobile ? 1 : 2}
        selected={value}
        defaultMonth={value?.from}
        onSelect={onChange}
      />
    </PickerPopover>
  );
}

type TimeOption = { label: string; date: Date };

// every option is the full date it would produce, so "is this one selected"
// is just comparing it to the current value
function getTimeColumns(base: Date, hour12: boolean) {
  const isPm = base.getHours() >= 12;
  const hourOptions: TimeOption[] = hour12
    ? HOURS_12.map((hour) => ({
        label: padTwoDigits(hour),
        date: setHours(base, (hour % 12) + (isPm ? 12 : 0)),
      }))
    : HOURS_24.map((hour) => ({
        label: padTwoDigits(hour),
        date: setHours(base, hour),
      }));
  const minuteOptions = MINUTES.map((minute) => ({
    label: padTwoDigits(minute),
    date: setMinutes(base, minute),
  }));
  const meridiemOptions = [
    { label: "AM", date: setHours(base, base.getHours() % 12) },
    { label: "PM", date: setHours(base, (base.getHours() % 12) + 12) },
  ];

  const columns = [
    { name: "Hour", options: hourOptions },
    { name: "Minute", options: minuteOptions },
    ...(hour12 ? [{ name: "AM/PM", options: meridiemOptions }] : []),
  ];
  return columns.map((column) => ({
    ...column,
    selectedIndex: column.options.findIndex(
      (option) => option.date.getTime() === base.getTime(),
    ),
  }));
}

// ios style scroll wheel. scroll snap does the snapping, the pick happens
// once scrolling settles. didn't use the scrollend event cuz older safari
// doesn't have it and the wheel matters most on phones
function WheelColumn({
  name,
  options,
  selectedIndex,
  onSelect,
}: {
  name: string;
  options: TimeOption[];
  selectedIndex: number;
  onSelect: (date: Date) => void;
}) {
  const columnRef = useRef<HTMLDivElement>(null);
  const scrollSettleTimeout = useRef<number>(undefined);

  useEffect(() => {
    if (columnRef.current)
      columnRef.current.scrollTop = selectedIndex * WHEEL_ITEM_HEIGHT_PX;
  }, [selectedIndex]);

  const scrollToIndex = (index: number) =>
    columnRef.current?.scrollTo({
      top: index * WHEEL_ITEM_HEIGHT_PX,
      behavior: "smooth",
    });

  const selectCenteredOptionOnceSettled = () => {
    window.clearTimeout(scrollSettleTimeout.current);
    scrollSettleTimeout.current = window.setTimeout(() => {
      const scrollTop = columnRef.current?.scrollTop ?? 0;
      const centeredIndex = Math.round(scrollTop / WHEEL_ITEM_HEIGHT_PX);
      const centeredOption = options[centeredIndex];
      if (centeredOption && centeredIndex !== selectedIndex)
        onSelect(centeredOption.date);
    }, 120);
  };

  // lets the first and last option scroll up to the center line
  const edgeSpacer = (
    <div
      aria-hidden
      style={{ height: `calc(50cqh - ${WHEEL_ITEM_HEIGHT_PX / 2}px)` }}
    />
  );

  return (
    <div
      ref={columnRef}
      role="listbox"
      aria-label={name}
      tabIndex={0}
      onScroll={selectCenteredOptionOnceSettled}
      className="relative w-12 snap-y snap-mandatory overflow-y-auto overscroll-contain rounded-lg outline-none [container-type:size] [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      {edgeSpacer}
      {options.map(({ label }, index) => (
        <button
          key={label}
          type="button"
          tabIndex={-1}
          role="option"
          aria-selected={index === selectedIndex}
          style={{ height: WHEEL_ITEM_HEIGHT_PX }}
          className="wheel-item flex w-full snap-center items-center justify-center text-sm tabular-nums aria-selected:font-medium"
          onClick={() => scrollToIndex(index)}
        >
          {label}
        </button>
      ))}
      {edgeSpacer}
    </div>
  );
}

export function DateTimePicker({
  value,
  onChange,
  hour12 = true,
  placeholder = hour12 ? "MM/DD/YYYY hh:mm aa" : "MM/DD/YYYY HH:mm",
}: {
  value?: Date;
  onChange: (date: Date) => void;
  hour12?: boolean;
  placeholder?: string;
}) {
  const base = value ?? startOfDay(new Date());
  const label =
    value && format(value, hour12 ? "MM/dd/yyyy hh:mm aa" : "MM/dd/yyyy HH:mm");
  const timeColumns = getTimeColumns(base, hour12);

  return (
    <PickerPopover title="Pick a date and time" {...{ label, placeholder }}>
      <div className="flex flex-col items-center gap-2 md:flex-row md:items-stretch md:gap-0">
        <Calendar
          mode="single"
          required
          className={CALENDAR_CLASS}
          selected={value}
          defaultMonth={value}
          onSelect={(day) =>
            onChange(
              set(day, { hours: base.getHours(), minutes: base.getMinutes() }),
            )
          }
        />
        {/* the wheels have size containment, so on desktop the calendar alone decides the height */}
        <div className="relative flex h-40 w-full justify-center [mask-image:linear-gradient(transparent,black_20%,black_80%,transparent)] md:h-auto md:w-auto md:border-l md:px-1">
          <div
            aria-hidden
            style={{ height: WHEEL_ITEM_HEIGHT_PX }}
            className="pointer-events-none absolute inset-x-1 top-1/2 -translate-y-1/2 rounded-lg bg-muted corner-squircle"
          />
          {timeColumns.map((column) => (
            <WheelColumn key={column.name} {...column} onSelect={onChange} />
          ))}
        </div>
      </div>
    </PickerPopover>
  );
}
