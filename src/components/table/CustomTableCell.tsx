"use client";

import {
  CheckIcon,
  Copy01Icon,
  FullScreenIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { type ReactNode, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { RelativeTime } from "@/components/RelativeTime";
import { ResponsivePopover } from "@/components/ResponsivePopover";
import { Badge } from "@/shadcn/ui/badge";
import { Button } from "@/shadcn/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import { cn } from "@/shadcn/utils";
import { useCopyToClipboard } from "@/utils/clipboard";
import { getColorStyle } from "@/utils/color";
import { useResizeObserver } from "@/utils/useResizeObserver";
import { CornerCountBadge } from "./CornerCountBadge";
import { CustomTableEmptyValue } from "./CustomTableEmptyValue";
import {
  ColumnType,
  type CustomTableColumn,
  type CustomTableEnumValue,
} from "./columns";

export function EnumBadge({ value }: { value: CustomTableEnumValue }) {
  const badge = (
    <Badge
      style={getColorStyle(value.color)}
      className={cn(
        "shadow-sm text-shadow-2xs text-shadow-black/2",
        value.onClick && "cursor-pointer hover:underline underline-offset-2",
      )}
    >
      <Icon icon={value.icon} />
      {value.label}
    </Badge>
  );
  if (!value.onClick) return badge;
  return (
    <button type="button" onClick={value.onClick}>
      {badge}
    </button>
  );
}

function CopyButton({ value }: { value: string }) {
  const { copied, copy } = useCopyToClipboard();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-6 cursor-copy"
      onClick={() => copy(value)}
    >
      <Icon icon={copied ? CheckIcon : Copy01Icon} />
      <span className="sr-only">Copy</span>
    </Button>
  );
}

export function DateCell({ date }: { date: Date | undefined }) {
  if (!date) return <CustomTableEmptyValue />;

  return <RelativeTime {...{ date }} className="font-normal italic" />;
}

// keeps the start and a fixed-length tail visible, ellipsizing only the middle
function MiddleTruncatedText({
  value,
  monospace,
}: {
  value: string;
  monospace?: boolean;
}) {
  const tailLength = Math.min(8, Math.floor(value.length / 3));
  const head = value.slice(0, value.length - tailLength);
  const tail = value.slice(value.length - tailLength);

  return (
    <span
      className={cn(
        "flex max-w-64 items-center",
        monospace && "font-mono text-xs",
      )}
    >
      <span className="overflow-hidden text-ellipsis whitespace-pre">
        {head}
      </span>
      <span className="shrink-0 whitespace-pre">{tail}</span>
    </span>
  );
}

// clamps its content to the cell, and only once something is actually cut
// off (measured, a wide column fits 4 tags a narrow one clips at 3) it fades
// the bottom, shows a count badge and a click opens the whole thing glued
// right over the cell (a sheet on phones)
function ExpandableCell({
  title,
  icon,
  count,
  clampClassName,
  children,
}: {
  title: string;
  icon: IconSvgElement;
  count?: number;
  clampClassName: string;
  children: ReactNode;
}) {
  const cellRef = useRef<HTMLDivElement>(null);
  const clampRef = useRef<HTMLDivElement>(null);
  const [isClipped, setIsClipped] = useState(false);
  const [open, setOpen] = useState(false);

  useResizeObserver([clampRef], () => {
    const clamp = clampRef.current;
    if (clamp) setIsClipped(clamp.scrollHeight > clamp.clientHeight + 1);
  });

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: the corner badge is the keyboard way in, this is a bigger mouse target on top
    // biome-ignore lint/a11y/useKeyWithClickEvents: same, the badge handles keys
    <div
      ref={cellRef}
      className={cn("relative", isClipped && "cursor-zoom-in")}
      onClick={() => isClipped && setOpen(true)}
    >
      <div
        ref={clampRef}
        className={cn(
          "overflow-hidden",
          clampClassName,
          isClipped && "mask-b-from-60%",
        )}
      >
        {children}
      </div>
      {isClipped && (
        <ResponsivePopover
          {...{ open, title, icon }}
          onOpenChange={setOpen}
          anchorRef={cellRef}
          side="bottom"
          align="start"
          // negative offset = the popover's top edge sits on the cell's top
          // edge, so it reads as the cell itself growing
          sideOffset={-(cellRef.current?.offsetHeight ?? 0) - 8}
          className="px-4 pb-6 md:-mx-3 md:w-max md:max-w-96 md:min-w-[calc(var(--radix-popper-anchor-width)+1.5rem)] md:p-3"
          trigger={
            <CornerCountBadge
              aria-label={`Show all ${title.toLowerCase()}`}
              className="cursor-zoom-in"
            >
              {count}
              <Icon icon={FullScreenIcon} className="size-3" />
            </CornerCountBadge>
          }
        >
          <div className="flex max-h-[60dvh] flex-col gap-2 overflow-y-auto">
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground max-md:hidden">
              <Icon {...{ icon }} />
              {title}
            </span>
            {children}
          </div>
        </ResponsivePopover>
      )}
    </div>
  );
}

export function CustomTableCell<T>({
  column,
  item,
}: {
  column: CustomTableColumn<T>;
  item: T;
}) {
  if (column.type === ColumnType.String) {
    if (column.render) return column.render(item);
    const value = column.getString(item);
    if (!value) return <CustomTableEmptyValue />;
    if (column.longText)
      return (
        <ExpandableCell
          title={column.label}
          icon={column.icon}
          clampClassName="line-clamp-2"
        >
          <p className="max-w-72 min-w-40 text-left whitespace-pre-wrap">
            {value}
          </p>
        </ExpandableCell>
      );
    const content =
      column.truncate === "middle" ? (
        <MiddleTruncatedText {...{ value }} monospace={column.monospace} />
      ) : (
        <span className={cn(column.monospace && "font-mono text-xs")}>
          {value}
        </span>
      );
    if (!column.onClick) return content;
    return (
      <button
        type="button"
        onClick={() => column.onClick?.(item)}
        className="cursor-pointer hover:underline underline-offset-2"
      >
        {content}
      </button>
    );
  }
  if (column.type === ColumnType.Copy)
    return <CopyButton value={column.getString(item)} />;
  if (column.type === ColumnType.Date)
    return <DateCell date={column.getDate(item)} />;
  if (column.type === ColumnType.Buttons) return <>{column.getButtons(item)}</>;
  if (column.type === ColumnType.Boolean)
    return column.getBoolean(item) ? (
      <div className="flex justify-center">
        <Icon icon={column.trueIcon ?? CheckIcon} className="text-green-500" />
      </div>
    ) : (
      <CustomTableEmptyValue />
    );

  if (column.type === ColumnType.Enum) {
    const value = column.getValue(item);
    const enumValue =
      value !== undefined ? column.enumOptions[value] : undefined;
    if (!enumValue) return <CustomTableEmptyValue />;
    const popoverContent = column.getPopoverContent?.(item);
    if (!popoverContent) return <EnumBadge value={enumValue} />;
    return (
      <Popover>
        <PopoverTrigger className="cursor-pointer">
          <EnumBadge value={enumValue} />
        </PopoverTrigger>
        <PopoverContent className="w-auto">{popoverContent}</PopoverContent>
      </Popover>
    );
  }

  const tags = column.getTags(item);
  if (tags.length === 0) return <CustomTableEmptyValue />;
  return (
    <ExpandableCell
      title={column.label}
      icon={column.icon}
      count={tags.length}
      clampClassName="max-h-11"
    >
      <div className="flex flex-wrap justify-center gap-1">
        {tags.map((tag) => (
          <EnumBadge key={tag.label} value={tag} />
        ))}
      </div>
    </ExpandableCell>
  );
}
