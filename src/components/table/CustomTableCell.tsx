"use client";

import {
  CheckIcon,
  Copy01Icon,
  FullScreenIcon,
} from "@hugeicons/core-free-icons";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { RelativeTime } from "@/components/RelativeTime";
import { Badge } from "@/shadcn/ui/badge";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shadcn/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import { cn } from "@/shadcn/utils";
import { useCopyToClipboard } from "@/utils/clipboard";
import { getColorStyle } from "@/utils/color";
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

function TagsCell({
  tags,
  itemLabel,
}: {
  tags: CustomTableEnumValue[];
  itemLabel: string;
}) {
  const tagsRef = useRef<HTMLDivElement>(null);
  const [isClipped, setIsClipped] = useState(false);
  const badges = tags.map((tag) => <EnumBadge key={tag.label} value={tag} />);

  // measured, not guessed from the tag count: a wide column fits 4 tags
  // without clipping anything, a narrow one clips at 3
  useEffect(() => {
    const container = tagsRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() =>
      setIsClipped(container.scrollHeight > container.clientHeight + 1),
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <Dialog>
      <div className="relative">
        <div
          ref={tagsRef}
          className={cn(
            "flex max-h-11 flex-wrap justify-center gap-1 overflow-hidden",
            isClipped && "mask-b-from-60%",
          )}
        >
          {badges}
        </div>
        {isClipped && (
          <DialogTrigger asChild>
            <CornerCountBadge>
              {tags.length}
              <Icon icon={FullScreenIcon} className="size-3" />
            </CornerCountBadge>
          </DialogTrigger>
        )}
      </div>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {tags.length} {itemLabel}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-wrap gap-1">{badges}</div>
      </DialogContent>
    </Dialog>
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
  return <TagsCell {...{ tags }} itemLabel={column.label.toLowerCase()} />;
}
