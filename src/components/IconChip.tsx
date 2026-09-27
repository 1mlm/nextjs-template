import type { IconSvgElement } from "@hugeicons/react";
import { Icon } from "@/components/Icon";
import { cn } from "@/shadcn/utils";

// the small squircle icon that sits next to a sheet/dialog title so the
// header isn't just a lonely line of text
export function IconChip({
  icon,
  className,
}: {
  icon: IconSvgElement;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-foreground",
        className,
      )}
    >
      <Icon {...{ icon }} className="size-4" />
    </span>
  );
}
