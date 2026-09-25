import type { ComponentProps } from "react";
import { Input } from "@/shadcn/ui/input";

export function isValidNumberText(value: string): boolean {
  const trimmed = value.trim();
  return trimmed !== "" && Number.isFinite(Number(trimmed));
}

// type/cut/paste freely, it's just a string. the red outline only shows once
// the text is non-empty and NOT a number, so halfway states like "-" or "3."
// never flash an error mid typing
export function NumberTextInput({
  value,
  onChange,
  ...props
}: {
  value: string;
  onChange: (raw: string) => void;
} & Omit<ComponentProps<typeof Input>, "value" | "onChange" | "type">) {
  const isInvalid = value.trim() !== "" && !isValidNumberText(value);

  return (
    <Input
      type="text"
      inputMode="decimal"
      {...{ value }}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={isInvalid}
      {...props}
    />
  );
}
