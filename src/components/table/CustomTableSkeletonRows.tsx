import { Skeleton } from "@/shadcn/ui/skeleton";
import { TableCell, TableRow } from "@/shadcn/ui/table";
import { cn } from "@/shadcn/utils";
import type { CustomTableColumn } from "./columns";

// enough rows of about the real row height (a two line cell) to fill the
// table's scroll area, so a loaded table doesn't grow out of a short skeleton
const SKELETON_ROW_KEYS = Array.from({ length: 16 }, (_, i) => `skeleton-${i}`);

export function CustomTableSkeletonRows<T>({
  columns,
  selectable,
}: {
  columns: CustomTableColumn<T>[];
  selectable?: boolean;
}) {
  return (
    <>
      {SKELETON_ROW_KEYS.map((key, index) => (
        <TableRow
          key={key}
          className={cn("h-14", index % 2 === 1 && "bg-foreground/5")}
        >
          {selectable && (
            <TableCell className="sticky left-0 z-10 border-r border-border/50">
              <div className="flex justify-center pr-2!">
                <Skeleton className="size-4" />
              </div>
            </TableCell>
          )}
          {columns.map((column) => (
            <TableCell
              key={column.id}
              className="border-r border-border/50 last:border-r-0"
            >
              <Skeleton className="h-lh w-full min-w-12" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
