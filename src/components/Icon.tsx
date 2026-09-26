import { Loading01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ComponentProps } from "react";
import { cn } from "@/shadcn/utils";

export function Icon({
  icon,
  isLoading = false,
  strokeWidth = 2,
  className,
  ...props
}: ComponentProps<typeof HugeiconsIcon> & { isLoading?: boolean }) {
  return (
    <HugeiconsIcon
      icon={isLoading ? Loading01Icon : icon}
      className={cn("size-[1em] shrink-0", isLoading && "animate-spin", className)}
      {...{ strokeWidth }}
      {...props}
    />
  );
}
