"use client";

import ExcelJS from "exceljs";
import { useId, useState } from "react";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import { Label } from "@/shadcn/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shadcn/ui/radio-group";
import {
  ColumnType,
  type CustomTableColumn,
  getColumnExportValue,
} from "./columns";

const pad = (n: number) => String(n).padStart(2, "0");

// "prefix_08_07_2026_14_32_05.xlsx"
function buildExportFilename(prefix: string, extension: string) {
  const now = new Date();
  const stamp = [
    pad(now.getDate()),
    pad(now.getMonth() + 1),
    now.getFullYear(),
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join("_");
  return `${prefix}_${stamp}.${extension}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function buildExportRows<T>(items: T[], columns: CustomTableColumn<T>[]) {
  const exportableColumns = columns.filter(
    (column) => column.type !== ColumnType.Buttons,
  );
  return items.map((item) =>
    Object.fromEntries(
      exportableColumns.map((column) => [
        column.label,
        getColumnExportValue(column, item),
      ]),
    ),
  );
}

type ExportRows = Record<string, string>[];

async function downloadAsExcel(rows: ExportRows, filename: string) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Sheet1");
  sheet.columns = Object.keys(rows[0] ?? {}).map((key) => ({
    header: key,
    key,
  }));
  sheet.addRows(rows);
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    filename,
  );
}

const escapeCsvValue = (value: string) =>
  /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

function downloadAsCsv(rows: ExportRows, filename: string) {
  const headers = Object.keys(rows[0] ?? {});
  const lines = [
    headers,
    ...rows.map((row) => headers.map((header) => row[header])),
  ];
  downloadBlob(
    new Blob(
      [lines.map((line) => line.map(escapeCsvValue).join(",")).join("\n")],
      {
        type: "text/csv",
      },
    ),
    filename,
  );
}

enum ExportFormat {
  Excel = "excel",
  Csv = "csv",
}

const EXPORT_FORMATS: Record<
  ExportFormat,
  {
    label: string;
    extension: string;
    download: (rows: ExportRows, filename: string) => void | Promise<void>;
  }
> = {
  [ExportFormat.Excel]: {
    label: "Excel (.xlsx)",
    extension: "xlsx",
    download: downloadAsExcel,
  },
  [ExportFormat.Csv]: {
    label: "CSV (.csv)",
    extension: "csv",
    download: downloadAsCsv,
  },
};

export function ExtractDialog<T>({
  open,
  onOpenChange,
  items,
  columns,
  filePrefix,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: T[];
  columns: CustomTableColumn<T>[];
  filePrefix: string;
}) {
  const [selectedFormat, setSelectedFormat] = useState(ExportFormat.Excel);
  const radioIdPrefix = useId();

  const handleConfirm = async () => {
    const format = EXPORT_FORMATS[selectedFormat];
    await format.download(
      buildExportRows(items, columns),
      buildExportFilename(filePrefix, format.extension),
    );
    onOpenChange(false);
  };

  return (
    <Dialog {...{ open, onOpenChange }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Extract {items.length} item{items.length > 1 ? "s" : ""}
          </DialogTitle>
          <DialogDescription>
            Choose a file format to download the selected rows.
          </DialogDescription>
        </DialogHeader>
        <RadioGroup
          value={selectedFormat}
          onValueChange={(format: ExportFormat) => setSelectedFormat(format)}
        >
          {Object.values(ExportFormat).map((id) => (
            <div key={id} className="flex items-center gap-2">
              <RadioGroupItem value={id} id={`${radioIdPrefix}-${id}`} />
              <Label htmlFor={`${radioIdPrefix}-${id}`}>
                {EXPORT_FORMATS[id].label}
              </Label>
            </div>
          ))}
        </RadioGroup>
        <DialogFooter>
          <Button onClick={handleConfirm}>Confirm download</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
