import type { ComponentProps } from "react";
import { cn } from "@/shadcn/utils";

// small pill pinned to a cell's corner, showing a count with a trailing icon
export function CornerCountBadge({
  className,
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "absolute -top-2 -right-1 inline-flex items-center gap-1 rounded-full corner-squircle bg-popover px-1.5 py-0.5 text-xs shadow-sm ring-1 ring-border",
        className,
      )}
      {...props}
    />
  );
}
