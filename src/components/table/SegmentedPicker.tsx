import { Icon } from "@/components/Icon";
import { Label } from "@/shadcn/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shadcn/ui/radio-group";
import { cn } from "@/shadcn/utils";
import { getColorStyle } from "@/utils/color";
import type { CustomTableEnumValue } from "./columns";

// a labeled-and-colored alternative to a plain RadioGroup, built on the same
// CustomTableEnumValue shape a table's enum/tags columns already use, so a
// status/label picked here renders exactly like the badge it becomes
export function SegmentedPicker<T extends string>({
  name,
  value,
  onChange,
  options,
  stacked,
  disabled,
}: {
  name: string;
  value: T | undefined;
  onChange: (value: T) => void;
  options: Partial<Record<T, CustomTableEnumValue>>;
  // one option per row instead of a grid, for narrow containers (e.g. a
  // popover) where 3+ options side by side get cramped
  stacked?: boolean;
  disabled?: boolean;
}) {
  const presentOptions = Object.entries<CustomTableEnumValue | undefined>(
    options,
  ).filter(
    (entry): entry is [string, CustomTableEnumValue] => entry[1] !== undefined,
  );

  return (
    <RadioGroup
      value={value ?? ""}
      onValueChange={onChange}
      {...{ disabled }}
      className={stacked ? "flex flex-col gap-2" : "grid grid-cols-3 gap-2"}
    >
      {presentOptions.map(([optionValue, opt]) => {
        const isSelected = optionValue === value;
        return (
          <Label
            key={optionValue}
            htmlFor={`${name}-${optionValue}`}
            style={isSelected ? getColorStyle(opt.color) : undefined}
            className={cn(
              "flex items-center gap-2 rounded-md border py-2! px-3!",
              disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer",
              stacked ? "justify-start" : "justify-center",
              isSelected
                ? "border-transparent"
                : "border-input text-muted-foreground hover:bg-muted",
            )}
          >
            <RadioGroupItem
              value={optionValue}
              id={`${name}-${optionValue}`}
              className="sr-only absolute!"
            />
            <Icon icon={opt.icon} />
            {opt.label}
          </Label>
        );
      })}
    </RadioGroup>
  );
}
