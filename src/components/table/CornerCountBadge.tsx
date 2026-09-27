import type { ComponentProps } from "react";
import { cn } from "@/shadcn/utils";

// small pill pinned to a cell's bottom corner (the top one sat right on the
// first row of tags), showing a count with a trailing icon
export function CornerCountBadge({
  className,
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "absolute -right-1 -bottom-2 inline-flex items-center gap-1 rounded-full bg-popover px-1.5 py-0.5 text-xs shadow-sm ring-1 ring-border",
        className,
      )}
      {...props}
    />
  );
}
