"use client";

import {
  Calendar04Icon,
  CheckIcon,
  Clock01Icon,
  CodeIcon,
  Copy01Icon,
  Forward02Icon,
  FullScreenIcon,
} from "@hugeicons/core-free-icons";
import { useState } from "react";
import { Icon } from "@/components/Icon";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn/ui/tooltip";
import { cn } from "@/shadcn/utils";
import { getColorStyle } from "@/utils/color";
import {
  formatDetailedDuration,
  formatExactDate,
  formatRelativeDate,
} from "@/utils/date";
import type { CustomTableColumn, CustomTableEnumValue } from "./CustomTable";
import { CustomTableEmptyValue } from "./CustomTableEmptyValue";

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
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <Button variant="ghost" size="icon" className="size-6" onClick={handleCopy}>
      <Icon icon={copied ? CheckIcon : Copy01Icon} />
    </Button>
  );
}

export function DateCell({ date }: { date: Date | undefined }) {
  if (!date) return <CustomTableEmptyValue />;

  return (
    <span className="font-normal italic inline-flex items-center gap-2 group/date">
      {formatRelativeDate(date)}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="opacity-0 group-hover/date:opacity-100 focus-visible:opacity-100 transition-opacity"
          >
            <Icon icon={Clock01Icon} className="size-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent sideOffset={6} className="flex-col items-start gap-1">
          <span className="inline-flex items-center gap-1.5">
            <Icon icon={Calendar04Icon} />
            {formatExactDate(date)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon icon={Forward02Icon} />
            {formatDetailedDuration(date)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon icon={CodeIcon} />
            <span className="font-semibold">Timestamp: </span>
            {date.getTime()}
          </span>
        </TooltipContent>
      </Tooltip>
    </span>
  );
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
  const hasOverflow = tags.length > 2;

  return (
    <Dialog>
      <div className="relative">
        <div
          className={cn(
            "flex max-h-11 flex-wrap justify-center gap-1 overflow-hidden",
            hasOverflow && "max-h-14 mask-b-from-60%",
          )}
        >
          {tags.map((tag) => (
            <EnumBadge key={tag.label} value={tag} />
          ))}
        </div>
        {hasOverflow && (
          <DialogTrigger asChild>
            <button
              type="button"
              className="absolute -top-2 -right-1 inline-flex items-center gap-1 rounded-full bg-popover px-1.5 py-0.5 text-xs shadow-sm ring-1 ring-border"
            >
              {tags.length}
              <Icon icon={FullScreenIcon} className="size-3" />
            </button>
          </DialogTrigger>
        )}
      </div>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {tags.length} {itemLabel}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <EnumBadge key={tag.label} value={tag} />
          ))}
        </div>
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
  if (column.type === "string") {
    const value = column.getString(item);
    if (!value) return <CustomTableEmptyValue />;
    const content =
      column.truncate === "middle" ? (
        <MiddleTruncatedText value={value} monospace={column.monospace} />
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
  if (column.type === "copy") {
    return <CopyButton value={column.getString(item)} />;
  }
  if (column.type === "date") return <DateCell date={column.getDate(item)} />;
  if (column.type === "buttons") return <>{column.getButtons(item)}</>;
  if (column.type === "boolean") {
    return column.getBoolean(item) ? (
      <div className="flex justify-center">
        <Icon icon={column.trueIcon ?? CheckIcon} className="text-green-500" />
      </div>
    ) : (
      <CustomTableEmptyValue />
    );
  }

  if (column.type === "enum") {
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
  return <TagsCell tags={tags} itemLabel={column.label.toLowerCase()} />;
}
