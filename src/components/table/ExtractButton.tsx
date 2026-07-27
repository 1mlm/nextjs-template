"use client";

import { Download01Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
import type { CustomTableColumn } from "./CustomTable";
import { ExtractDialog } from "./ExtractDialog";

export function ExtractButton<T>({
  selectedItems,
  columns,
  filePrefix,
}: {
  selectedItems: T[];
  columns: CustomTableColumn<T>[];
  filePrefix: string;
}) {
  const [open, setOpen] = useState(false);

  if (selectedItems.length === 0) return null;

  return (
    <>
      <Button
        variant="outline"
        className="shadow-lg"
        onClick={() => setOpen(true)}
      >
        <Icon icon={Download01Icon} />
        <span className="hidden sm:inline">
          Extract {selectedItems.length} item
          {selectedItems.length > 1 ? "s" : ""}
        </span>
        <span className="sm:hidden">Extract {selectedItems.length}</span>
      </Button>
      <ExtractDialog
        {...{ open, columns, filePrefix }}
        onOpenChange={setOpen}
        items={selectedItems}
      />
    </>
  );
}
