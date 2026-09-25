import { HugeiconsIcon } from "@hugeicons/react";
import type { ComponentProps } from "react";
import { cn } from "@/shadcn/utils";

export function Icon({
  strokeWidth = 2,
  className,
  ...props
}: ComponentProps<typeof HugeiconsIcon>) {
  return (
    <HugeiconsIcon
      className={cn("size-[1em]", className)}
      {...{ strokeWidth }}
      {...props}
    />
  );
}
