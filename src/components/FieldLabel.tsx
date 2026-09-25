import type { IconSvgElement } from "@hugeicons/react";
import type { ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { Label } from "@/shadcn/ui/label";

export function FieldLabel({
  htmlFor,
  required,
  icon,
  children,
}: {
  htmlFor?: string;
  required?: boolean;
  icon?: IconSvgElement;
  children: ReactNode;
}) {
  return (
    <Label {...{ htmlFor }}>
      {icon && <Icon {...{ icon }} className="size-4 text-muted-foreground" />}
      {children}
      {required && <span className="text-destructive">*</span>}
    </Label>
  );
}
