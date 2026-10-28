import type { IconSvgElement } from "@hugeicons/react";
import type { ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { UserAvatar } from "@/components/UserAvatar";
import { cn } from "@/shadcn/utils";
import { EnumBadge } from "./CustomTableCell";
import type { CustomTableEnumValue } from "./columns";

export type RowCardContent = {
  avatar?: { name: string; src?: string };
  // text, the three dots sheet uses it as its heading
  title: string;
  subtitle?: ReactNode;
  badges?: CustomTableEnumValue[];
  // a few icon + text lines under the badges, the facts worth seeing without opening the row
  details?: { label: string; icon: IconSvgElement; text: ReactNode }[];
};

// a table row as a card, for phones where the columns don't fit. tapping it
// runs onOpen, the row's own controls (its buttons columns) sit in the corner
export function RowCard({
  content,
  onOpen,
  openLabel,
  leading,
  trailing,
  className,
}: {
  content: RowCardContent;
  onOpen?: () => void;
  // what a screen reader calls the tap target, defaults to the title
  openLabel?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  const { avatar, title, subtitle, badges, details } = content;
  return (
    <div
      className={cn(
        "relative flex items-start gap-3 rounded-2xl border bg-card p-3 shadow-xs",
        onOpen && "transition-transform active:scale-[0.99]",
        className,
      )}
    >
      {/* the card's tap target is a button stretched over the whole card, a
      card that was itself a button couldn't hold the checkbox and the dots.
      those two sit above it */}
      {onOpen && (
        <button
          type="button"
          aria-label={openLabel ?? title}
          onClick={onOpen}
          className="absolute inset-0 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      )}
      {leading && <div className="relative z-10">{leading}</div>}
      {avatar && (
        <UserAvatar
          className="mt-0.5 size-12 rounded-xl *:rounded-[inherit]"
          {...avatar}
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{title}</div>
          {subtitle && (
            <div className="truncate text-xs text-muted-foreground">
              {subtitle}
            </div>
          )}
        </div>
        {badges && badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {badges.map((badge) => (
              <EnumBadge key={badge.label} value={badge} />
            ))}
          </div>
        )}
        {details && details.length > 0 && (
          <div className="flex flex-col gap-0.5">
            {details.map((detail) => (
              <span
                key={detail.label}
                title={detail.label}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <Icon icon={detail.icon} className="size-3.5 shrink-0" />
                <span className="min-w-0 truncate">{detail.text}</span>
              </span>
            ))}
          </div>
        )}
      </div>
      {trailing && (
        <div className="relative z-10 -mt-1 -mr-1 shrink-0">{trailing}</div>
      )}
    </div>
  );
}
