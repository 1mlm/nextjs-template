"use client";

import {
  CheckmarkCircle02Icon,
  Clock01Icon,
  FileAttachmentIcon,
  Location01Icon,
  Money03Icon,
  Tag01Icon,
  UnavailableIcon,
  UserCircleIcon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import {
  Combobox,
  type ComboboxOption,
  MultiCombobox,
} from "@/components/Combobox";
import {
  DatePicker,
  DateRangePicker,
  DateTimePicker,
} from "@/components/DatePicker";
import { FieldLabel } from "@/components/FieldLabel";
import { FileDropZone } from "@/components/FileDropZone";
import { NumberTextInput } from "@/components/NumberTextInput";
import { SearchBar } from "@/components/SearchBar";
import { SuggestionInput } from "@/components/SuggestionInput";
import type { CustomTableEnumValue } from "@/components/table/columns";
import { SegmentedPicker } from "@/components/table/SegmentedPicker";
import type { ShowcaseItem } from "./ShowcaseCard";

enum Status {
  Active = "active",
  Pending = "pending",
  Banned = "banned",
}

const STATUS_OPTIONS: Record<Status, CustomTableEnumValue> = {
  [Status.Active]: {
    label: "Active",
    icon: CheckmarkCircle02Icon,
    color: "green",
  },
  [Status.Pending]: { label: "Pending", icon: Clock01Icon, color: "amber" },
  [Status.Banned]: { label: "Banned", icon: UnavailableIcon, color: "red" },
};

const PEOPLE: ComboboxOption[] = [
  {
    value: "amina",
    label: "Amina Benali",
    icon: UserIcon,
    hint: "amina@example.com",
  },
  {
    value: "youssef",
    label: "Youssef Haddad",
    icon: UserIcon,
    hint: "youssef@example.com",
  },
  {
    value: "sofia",
    label: "Sofia Cherkaoui",
    icon: UserIcon,
    hint: "sofia@example.com",
  },
  {
    value: "karim",
    label: "Karim Ziani",
    icon: UserIcon,
    hint: "karim@example.com",
  },
  {
    value: "lina",
    label: "Lina Otmani",
    icon: UserIcon,
    hint: "lina@example.com",
  },
];

const LABELS: ComboboxOption[] = [
  { value: "bug", label: "bug", icon: Tag01Icon, hint: "12" },
  { value: "design", label: "design", icon: Tag01Icon, hint: "4" },
  { value: "backend", label: "backend", icon: Tag01Icon, hint: "9" },
  { value: "urgent", label: "urgent", icon: Tag01Icon, hint: "2" },
  { value: "idea", label: "idea", icon: Tag01Icon, hint: "7" },
];

const PAST_CITIES = [
  "Casablanca",
  "Rabat",
  "Marrakech",
  "Fes",
  "Tangier",
  "Agadir",
  "Ifrane",
  "Meknes",
];

function ComboboxDemo() {
  const [assignee, setAssignee] = useState("");
  return (
    <Combobox
      options={PEOPLE}
      value={assignee}
      onValueChange={setAssignee}
      title="Assign someone"
      icon={UserCircleIcon}
      placeholder="Assign someone"
      searchPlaceholder="Search by name or email..."
    />
  );
}

function MultiComboboxDemo() {
  const [labels, setLabels] = useState(["bug", "urgent"]);
  return (
    <MultiCombobox
      options={LABELS}
      values={labels}
      onValuesChange={setLabels}
      title="Labels"
      icon={Tag01Icon}
      placeholder="Add labels"
      searchPlaceholder="Search labels..."
    />
  );
}

function SuggestionInputDemo() {
  const [city, setCity] = useState("");
  return (
    <SuggestionInput
      value={city}
      onValueChange={setCity}
      suggestions={PAST_CITIES}
      icon={Location01Icon}
      placeholder="City (try typing an a)"
      className="w-full"
    />
  );
}

function NumberTextInputDemo() {
  const [value, setValue] = useState("12.5");

  return (
    <div className="flex w-full flex-col gap-2">
      <FieldLabel htmlFor="demo-amount" icon={Money03Icon} required>
        Amount
      </FieldLabel>
      <NumberTextInput
        id="demo-amount"
        {...{ value }}
        onChange={setValue}
        placeholder="try typing letters"
      />
    </div>
  );
}

function FileDropZoneDemo() {
  const [fileName, setFileName] = useState<string>();

  return (
    <FileDropZone
      accept="image/*,.pdf"
      icon={FileAttachmentIcon}
      label={fileName ?? "drop an image or pdf, or click"}
      onFile={(file) => setFileName(file.name)}
    />
  );
}

function SegmentedPickerDemo() {
  const [status, setStatus] = useState(Status.Active);

  return (
    <SegmentedPicker
      name="demo-status"
      value={status}
      onChange={setStatus}
      options={STATUS_OPTIONS}
    />
  );
}

function DatePickerDemo() {
  const [date, setDate] = useState<Date>();
  return <DatePicker value={date} onChange={setDate} />;
}

function DateRangePickerDemo() {
  const [range, setRange] = useState<DateRange>();
  return <DateRangePicker value={range} onChange={setRange} />;
}

function DateTimePickerDemo({ hour12 }: { hour12: boolean }) {
  const [date, setDate] = useState<Date>();
  return <DateTimePicker value={date} onChange={setDate} {...{ hour12 }} />;
}

export const INPUT_ITEMS: ShowcaseItem[] = [
  {
    name: "SearchBar",
    path: "src/components/SearchBar.tsx",
    description:
      "search input synced to the url with nuqs (watch the address bar)",
    Demo: () => (
      <SearchBar
        queryKey="demo_search"
        placeholder="Search anything..."
        trailing="12 results"
        className="w-full"
      />
    ),
  },
  {
    name: "Combobox",
    path: "src/components/Combobox.tsx",
    description:
      "searchable select, arrows + enter work, bottom sheet on phones. searches the hint too (try an email)",
    Demo: ComboboxDemo,
  },
  {
    name: "MultiCombobox",
    path: "src/components/Combobox.tsx",
    description:
      "same panel but stays open while you pick, chips x out without opening it",
    Demo: MultiComboboxDemo,
  },
  {
    name: "SuggestionInput",
    path: "src/components/SuggestionInput.tsx",
    description:
      "free text with past values underneath, a datalist that respects the theme",
    Demo: SuggestionInputDemo,
  },
  {
    name: "NumberTextInput + FieldLabel",
    path: "src/components/NumberTextInput.tsx",
    description: "free typing, only goes red once the text isn't a number",
    Demo: NumberTextInputDemo,
  },
  {
    name: "FileDropZone",
    path: "src/components/FileDropZone.tsx",
    description: "click or drag a file, accept is enforced for drops too",
    Demo: FileDropZoneDemo,
  },
  {
    name: "SegmentedPicker",
    path: "src/components/table/SegmentedPicker.tsx",
    description:
      "colored radio group using the same shape as table enum badges",
    Demo: SegmentedPickerDemo,
  },
  {
    name: "DatePicker",
    path: "src/components/DatePicker.tsx",
    description: "calendar in a popover, closes itself once a day is picked",
    Demo: DatePickerDemo,
  },
  {
    name: "DateRangePicker",
    path: "src/components/DatePicker.tsx",
    description: "two months side by side, one in the phone sheet",
    Demo: DateRangePickerDemo,
  },
  {
    name: "DateTimePicker",
    path: "src/components/DatePicker.tsx",
    description: "calendar plus scrollable hour / minute / AM-PM columns",
    Demo: () => <DateTimePickerDemo hour12 />,
  },
  {
    name: "DateTimePicker (24h)",
    path: "src/components/DatePicker.tsx",
    description: "same thing with hour12={false}, no AM/PM column",
    Demo: () => <DateTimePickerDemo hour12={false} />,
  },
];
