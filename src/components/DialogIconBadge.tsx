import type { IconSvgElement } from "@hugeicons/react";
import { Icon } from "@/components/Icon";
import { cn } from "@/shadcn/utils";

// floating squircle icon pinned to a dialog's top-left corner, ring matching
// the dialog background, pairs with a DialogContent using
// `md:overflow-visible md:pt-10`. phones get dialogs as edge to edge bottom
// sheets that scroll (so they clip), the badge just sits inline on top there
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
        "flex size-12 items-center justify-center rounded-2xl corner-superellipse/1.2 bg-primary md:absolute md:-top-6 md:-left-6 md:size-16 md:rotate-[-10deg] md:shadow-lg md:ring-4 md:ring-popover",
        className,
      )}
    >
      <Icon
        {...{ icon }}
        className="size-6! text-primary-foreground md:size-7!"
      />
    </div>
  );
}
