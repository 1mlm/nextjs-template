import type { ReactNode } from "react";
import { type HugeIcon, Icon } from "@/components/Icon";
import { Label } from "@/shadcn/ui/label";

export function FieldLabel({
  htmlFor,
  required,
  icon,
  children,
}: {
  htmlFor?: string;
  required?: boolean;
  icon?: HugeIcon;
  children: ReactNode;
}) {
  return (
    <Label htmlFor={htmlFor}>
      {icon && <Icon icon={icon} className="size-4 text-muted-foreground" />}
      {children}
      {required && <span className="text-destructive">*</span>}
    </Label>
  );
}
