import type { IconSvgElement } from "@hugeicons/react";
import type { CSSProperties } from "react";
import { Icon } from "@/components/Icon";
import { cn } from "@/shadcn/utils";

// small rounded toggle pill (tag filters, permission toggles). no color prop on
// purpose, pass `style={getColorStyle(color)}` from the caller, same as EnumBadge
export function Chip({
  icon,
  label,
  onClick,
  className,
  iconClassName,
  style,
}: {
  icon: IconSvgElement;
  label: string;
  onClick: () => void;
  className?: string;
  iconClassName?: string;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      {...{ onClick, style }}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg corner-squircle px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors",
        className,
      )}
    >
      <Icon {...{ icon }} className={iconClassName} />
      {label}
    </button>
  );
}
