import type { IconSvgElement } from "@hugeicons/react";
import type { ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { UserAvatar } from "@/components/UserAvatar";
import { cn } from "@/shadcn/utils";
import { EnumBadge } from "./CustomTableCell";
import type { CustomTableEnumValue } from "./columns";

export type RowCardContent = {
  avatar?: { name: string; src?: string };
  title: ReactNode;
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
  leading,
  trailing,
  className,
}: {
  content: RowCardContent;
  onOpen?: () => void;
  leading?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  const { avatar, title, subtitle, badges, details } = content;
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: a button role when it opens something, a nested button inside would be invalid html
    <div
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={(event) => event.key === "Enter" && onOpen?.()}
      className={cn(
        "flex items-start gap-3 rounded-2xl border bg-card p-3 shadow-xs",
        onOpen && "cursor-pointer transition-transform active:scale-[0.99]",
        className,
      )}
    >
      {leading}
      {avatar && <UserAvatar className="mt-0.5 size-10" {...avatar} />}
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
        // portaled menus still bubble their taps up the react tree into the card's own tap
        // biome-ignore lint/a11y/noStaticElementInteractions: only stops the bubble, not a control
        <div
          className="-mr-1 shrink-0"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          {trailing}
        </div>
      )}
    </div>
  );
}
