"use client";

import {
  CheckmarkCircle02Icon,
  Clock01Icon,
  FileAttachmentIcon,
  Money03Icon,
  UnavailableIcon,
} from "@hugeicons/core-free-icons";
import { useState } from "react";
import { FieldLabel } from "@/components/FieldLabel";
import { FileDropZone } from "@/components/FileDropZone";
import { NumberTextInput } from "@/components/NumberTextInput";
import { SearchBar } from "@/components/SearchBar";
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
];
