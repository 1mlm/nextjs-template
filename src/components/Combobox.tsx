"use client";

import {
  ArrowDown01Icon,
  Cancel01Icon,
  SearchRemoveIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { type ReactNode, useState } from "react";
import { Icon } from "@/components/Icon";
import { ResponsivePopover } from "@/components/ResponsivePopover";
import { Button } from "@/shadcn/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shadcn/ui/command";
import { triggerHaptic } from "@/utils/haptics";

export type ComboboxOption = {
  value: string;
  label: string;
  icon?: IconSvgElement;
  // muted text on the right of the row, also searchable (an email, a count...)
  hint?: string;
};

const TRIGGER_CLASS =
  "h-auto min-h-9 w-full justify-between gap-2 py-1.5 font-normal";

// the search box + rows, shared by both comboboxes. they only differ in the
// trigger and in what picking a row does
function ComboboxPanel({
  options,
  isSelected,
  onSelect,
  searchPlaceholder,
}: {
  options: ComboboxOption[];
  isSelected: (value: string) => boolean;
  onSelect: (value: string) => void;
  searchPlaceholder: string;
}) {
  const [search, setSearch] = useState("");

  return (
    <Command className="bg-transparent p-0">
      <CommandInput
        placeholder={searchPlaceholder}
        value={search}
        onValueChange={setSearch}
      />
      <CommandList className="mt-1 max-md:max-h-[50dvh]">
        <CommandEmpty className="flex flex-col items-center gap-1.5 py-6 text-muted-foreground">
          <Icon icon={SearchRemoveIcon} className="size-5" />
          nothing matches "{search}"
        </CommandEmpty>
        {options.map(({ value, label, icon, hint }) => (
          <CommandItem
            key={value}
            {...{ value }}
            keywords={[label, hint ?? ""]}
            data-checked={isSelected(value)}
            onSelect={() => onSelect(value)}
            className="cursor-pointer rounded-md corner-squircle max-md:py-2.5"
          >
            {icon && <Icon {...{ icon }} className="text-muted-foreground" />}
            <span className="flex-1 truncate">{label}</span>
            {hint && (
              <span className="truncate text-xs text-muted-foreground tabular-nums">
                {hint}
              </span>
            )}
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  );
}

function OptionLabel({ option }: { option: ComboboxOption }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      {option.icon && <Icon icon={option.icon} />}
      <span className="truncate">{option.label}</span>
    </span>
  );
}

// searchable single select. a hidden input carries the value so it drops
// into a plain <form> like a native <select> would
export function Combobox({
  name,
  options,
  value,
  onValueChange,
  title,
  icon,
  placeholder = "Pick one",
  searchPlaceholder = "Search...",
}: {
  name?: string;
  options: ComboboxOption[];
  value: string;
  onValueChange: (value: string) => void;
  title: string;
  icon: IconSvgElement;
  placeholder?: string;
  searchPlaceholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);

  return (
    <>
      {name && <input type="hidden" {...{ name, value }} />}
      <ResponsivePopover
        {...{ open, title, icon }}
        onOpenChange={setOpen}
        align="start"
        className="w-(--radix-popover-trigger-width) p-1 max-md:px-4 max-md:pb-6"
        trigger={
          <Button variant="outline" className={TRIGGER_CLASS}>
            {selectedOption ? (
              <OptionLabel option={selectedOption} />
            ) : (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Icon {...{ icon }} />
                {placeholder}
              </span>
            )}
            <Icon icon={ArrowDown01Icon} className="text-muted-foreground" />
          </Button>
        }
      >
        <ComboboxPanel
          {...{ options, searchPlaceholder }}
          isSelected={(optionValue) => optionValue === value}
          onSelect={(optionValue) => {
            triggerHaptic("selection");
            onValueChange(optionValue);
            setOpen(false);
          }}
        />
      </ResponsivePopover>
    </>
  );
}

function RemovableChip({
  children,
  onRemove,
  removeLabel,
}: {
  children: ReactNode;
  onRemove: () => void;
  removeLabel: string;
}) {
  return (
    <span className="flex h-6 items-center gap-1 rounded-md bg-muted pr-0.5 pl-2 text-xs corner-squircle">
      {children}
      {/* a span not a button, it lives inside the trigger button and a
      button inside a button is invalid html */}
      {/* biome-ignore lint/a11y/useSemanticElements: can't nest a real button in the trigger */}
      <span
        role="button"
        tabIndex={0}
        aria-label={removeLabel}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onRemove();
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          event.stopPropagation();
          onRemove();
        }}
        className="grid size-5 place-items-center rounded-sm text-muted-foreground hover:bg-background hover:text-foreground"
      >
        <Icon icon={Cancel01Icon} className="size-3" />
      </span>
    </span>
  );
}

// same thing but picks several: stays open while you pick, picked values
// sit in the trigger as chips you can x out without opening anything
export function MultiCombobox({
  name,
  options,
  values,
  onValuesChange,
  title,
  icon,
  placeholder = "Pick some",
  searchPlaceholder = "Search...",
}: {
  name?: string;
  options: ComboboxOption[];
  values: string[];
  onValuesChange: (values: string[]) => void;
  title: string;
  icon: IconSvgElement;
  placeholder?: string;
  searchPlaceholder?: string;
}) {
  const selectedOptions = options.filter((option) =>
    values.includes(option.value),
  );

  const toggleValue = (value: string) => {
    triggerHaptic("selection");
    onValuesChange(
      values.includes(value)
        ? values.filter((picked) => picked !== value)
        : [...values, value],
    );
  };

  return (
    <>
      {name &&
        values.map((value) => (
          <input key={value} type="hidden" {...{ name, value }} />
        ))}
      <ResponsivePopover
        {...{ title, icon }}
        align="start"
        className="w-(--radix-popover-trigger-width) p-1 max-md:px-4 max-md:pb-6"
        trigger={
          <Button variant="outline" className={TRIGGER_CLASS}>
            {selectedOptions.length > 0 ? (
              <span className="-ml-1 flex flex-wrap gap-1">
                {selectedOptions.map((option) => (
                  <RemovableChip
                    key={option.value}
                    onRemove={() => toggleValue(option.value)}
                    removeLabel={`Remove ${option.label}`}
                  >
                    <OptionLabel {...{ option }} />
                  </RemovableChip>
                ))}
              </span>
            ) : (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Icon {...{ icon }} />
                {placeholder}
              </span>
            )}
            <Icon
              icon={ArrowDown01Icon}
              className="shrink-0 text-muted-foreground"
            />
          </Button>
        }
      >
        <ComboboxPanel
          {...{ options, searchPlaceholder }}
          isSelected={(value) => values.includes(value)}
          onSelect={toggleValue}
        />
      </ResponsivePopover>
    </>
  );
}
