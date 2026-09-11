import type { CSSProperties } from "react";
import { type HugeIcon, Icon } from "@/components/Icon";
import { cn } from "@/shadcn/utils";

// small rounded toggle pill: tag filters, permission toggles. Color-agnostic
// on purpose — pass `style={getColorStyle(color)}` from the caller instead
// of baking a color prop in here, same as EnumBadge does
export function Chip({
  icon,
  label,
  onClick,
  className,
  iconClassName,
  style,
}: {
  icon: HugeIcon;
  label: string;
  onClick: () => void;
  className?: string;
  iconClassName?: string;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg corner-squircle px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors",
        className,
      )}
    >
      <Icon icon={icon} className={iconClassName} />
      {label}
    </button>
  );
}
