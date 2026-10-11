"use client";

import { Download01Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
import type { CustomTableColumn } from "./columns";
import { ExtractDialog } from "./ExtractDialog";

export function ExtractButton<T>({
  selectedItems,
  columns,
  loadExportColumns,
  filePrefix,
}: {
  selectedItems: T[];
  columns: CustomTableColumn<T>[];
  // fetched on the first click and kept, for export-only data too heavy to load with the page
  loadExportColumns?: () => Promise<CustomTableColumn<T>[]>;
  filePrefix: string;
}) {
  const [open, setOpen] = useState(false);
  const [loadedColumns, setLoadedColumns] = useState<
    CustomTableColumn<T>[] | null
  >(null);
  const [loading, setLoading] = useState(false);

  async function openDialog() {
    if (loadExportColumns && !loadedColumns) {
      setLoading(true);
      setLoadedColumns(
        await loadExportColumns().finally(() => setLoading(false)),
      );
    }
    setOpen(true);
  }

  if (selectedItems.length === 0) return null;

  return (
    <>
      <Button
        variant="outline"
        className="shadow-lg"
        disabled={loading}
        onClick={openDialog}
      >
        <Icon
          icon={loading ? Loading03Icon : Download01Icon}
          className={loading ? "animate-spin" : undefined}
        />
        <span className="hidden sm:inline">
          Extract {selectedItems.length} item
          {selectedItems.length > 1 ? "s" : ""}
        </span>
        <span className="sm:hidden">Extract {selectedItems.length}</span>
      </Button>
      <ExtractDialog
        {...{ open, filePrefix }}
        columns={loadedColumns ?? columns}
        onOpenChange={setOpen}
        items={selectedItems}
      />
    </>
  );
}
