"use client";

import { useRef, useState } from "react";
import { type HugeIcon, Icon } from "@/components/Icon";
import { cn } from "@/shadcn/utils";

// click-to-browse + drag & drop file picker, single file only
export function FileDropZone({
  accept,
  icon,
  label,
  onFile,
  disabled,
}: {
  accept: string;
  icon: HugeIcon;
  label: string;
  onFile: (file: File) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onFile(file);
  };

  return (
    <button
      type="button"
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (!disabled) handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      disabled={disabled}
      className={cn(
        "flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed p-6 text-center text-sm text-muted-foreground transition-colors",
        dragOver
          ? "border-primary bg-primary/5 text-foreground"
          : "border-border hover:bg-muted/50",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <Icon icon={icon} className="size-6" />
      {label}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </button>
  );
}
