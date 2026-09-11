import type { ComponentProps } from "react";
import { Input } from "@/shadcn/ui/input";

export function isValidNumberText(value: string): boolean {
  const trimmed = value.trim();
  return trimmed !== "" && Number.isFinite(Number(trimmed));
}

// lets you type/cut/paste freely (raw string, no digit-by-digit validation)
// - only turns the invalid outline on once the field is non-empty and NOT a
// parsable number, so intermediate states like "-", "3.", or a mid-edit
// selection never flash an error
export function NumberTextInput({
  value,
  onChange,
  ...props
}: {
  value: string;
  onChange: (raw: string) => void;
} & Omit<ComponentProps<typeof Input>, "value" | "onChange" | "type">) {
  const trimmed = value.trim();
  const isInvalid = trimmed !== "" && !Number.isFinite(Number(trimmed));

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={isInvalid}
      {...props}
    />
  );
}
