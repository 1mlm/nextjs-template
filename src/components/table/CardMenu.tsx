"use client";

import {
  InformationCircleIcon,
  MoreVerticalIcon,
} from "@hugeicons/core-free-icons";
import { type ReactNode, useState } from "react";
import { Icon } from "@/components/Icon";
import { ResponsivePopover } from "@/components/ResponsivePopover";
import { Button } from "@/shadcn/ui/button";
import { CustomTableCell } from "./CustomTableCell";
import { ColumnType, type CustomTableColumn } from "./columns";

// the three dots on a row card: a popover on a computer, a bottom sheet on a
// phone. the row's actions first (a thumb reaches the top of a sheet first),
// then every value the card didn't have room for as label and value
export function CardMenu<T>({
  item,
  columns,
  title,
  actions,
}: {
  item: T;
  columns: CustomTableColumn<T>[];
  title: string;
  // gets a close() so an action can dismiss the sheet
  actions?: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  // the avatar column and the buttons are already on the card
  const detailColumns = columns.filter(
    (column) => column.type !== ColumnType.Buttons && !column.iconOnly,
  );

  return (
    <ResponsivePopover
      {...{ open, title }}
      onOpenChange={setOpen}
      icon={InformationCircleIcon}
      align="end"
      className="flex w-80 flex-col gap-4 p-3 max-md:max-h-[80dvh] max-md:w-full max-md:overflow-y-auto max-md:px-4 max-md:pb-6"
      trigger={
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Details and actions for ${title}`}
        >
          <Icon icon={MoreVerticalIcon} />
        </Button>
      }
    >
      {actions && (
        <div className="flex flex-col gap-1">
          {actions(() => setOpen(false))}
        </div>
      )}
      <dl className="grid grid-cols-[6rem_1fr] items-start gap-x-3 gap-y-2.5 text-sm">
        {detailColumns.map((column) => (
          <div key={column.id} className="col-span-2 grid grid-cols-subgrid">
            <dt className="pt-0.5 text-xs text-muted-foreground">
              {column.label}
            </dt>
            <dd className="min-w-0 *:justify-start *:text-left">
              <CustomTableCell {...{ column, item }} />
            </dd>
          </div>
        ))}
      </dl>
    </ResponsivePopover>
  );
}
