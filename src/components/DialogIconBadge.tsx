import type { IconSvgElement } from "@hugeicons/react";
import { Icon } from "@/components/Icon";
import { cn } from "@/shadcn/utils";

// floating squircle icon pinned to a dialog's top-left corner, ring matching
// the dialog background, pairs with a DialogContent using
// `overflow-visible pt-10`
export function DialogIconBadge({
  icon,
  className,
}: {
  icon: IconSvgElement;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "absolute -top-6 -left-6 flex size-16 rotate-[-10deg] items-center justify-center rounded-2xl corner-superellipse/1.2 bg-primary shadow-lg ring-4 ring-popover",
        className,
      )}
    >
      <Icon {...{ icon }} className="size-7! text-primary-foreground" />
    </div>
  );
}
