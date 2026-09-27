"use client";

import type { IconSvgElement } from "@hugeicons/react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/Icon";
import { cn } from "@/shadcn/utils";

// the input's accept attr only filters the browse dialog, drops skip it entirely
function isFileAccepted(file: File, accept: string) {
  const patterns = accept
    .split(",")
    .map((pattern) => pattern.trim().toLowerCase());
  const fileName = file.name.toLowerCase();
  const mimeType = file.type.toLowerCase();
  return patterns.some((pattern) => {
    if (pattern.startsWith(".")) return fileName.endsWith(pattern);
    if (pattern.endsWith("/*"))
      return mimeType.startsWith(pattern.slice(0, -1));
    return mimeType === pattern;
  });
}

// "image/*,.pdf" reads as "images or PDF"
const formatAcceptHint = (accept: string) =>
  new Intl.ListFormat("en", { type: "disjunction" }).format(
    accept.split(",").map((pattern) => {
      const trimmed = pattern.trim();
      if (trimmed.endsWith("/*")) return `${trimmed.slice(0, -2)}s`;
      if (trimmed.startsWith(".")) return trimmed.slice(1).toUpperCase();
      return trimmed;
    }),
  );

// true while a file is dragged anywhere over the window. dragenter/leave
// fire for every child the pointer crosses, so a plain toggle flickers,
// counting enters minus leaves and flipping off at zero is the usual fix
function useWindowFileDrag(isEnabled: boolean, onDrop: (file: File) => void) {
  const [isDragging, setIsDragging] = useState(false);
  const dragDepth = useRef(0);
  const handleDrop = useEffectEvent(onDrop);

  useEffect(() => {
    if (!isEnabled) return;
    const isFileDrag = (event: DragEvent) =>
      event.dataTransfer?.types.includes("Files") ?? false;

    const onDragEnter = (event: DragEvent) => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      dragDepth.current += 1;
      setIsDragging(true);
    };
    // without this the browser opens the file itself and leaves the app
    const onDragOver = (event: DragEvent) => {
      if (isFileDrag(event)) event.preventDefault();
    };
    const onDragLeave = (event: DragEvent) => {
      if (!isFileDrag(event)) return;
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setIsDragging(false);
    };
    const onWindowDrop = (event: DragEvent) => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      dragDepth.current = 0;
      setIsDragging(false);
      const file = event.dataTransfer?.files[0];
      if (file) handleDrop(file);
    };

    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onWindowDrop);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onWindowDrop);
      // switched off mid drag, no more events will come to hide the overlay
      dragDepth.current = 0;
      setIsDragging(false);
    };
  }, [isEnabled]);

  return isDragging;
}

// the whole page turns into the drop target while a file hovers it
function WindowDropOverlay({
  icon,
  label,
  acceptHint,
}: {
  icon: IconSvgElement;
  label: string;
  acceptHint: string;
}) {
  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-100 grid place-items-center bg-background/70 p-4 backdrop-blur-sm animate-in fade-in-0">
      <div className="flex size-full flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-foreground/30 text-center animate-in zoom-in-95">
        <span className="grid size-16 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg motion-safe:animate-bounce">
          <Icon {...{ icon }} className="size-7" />
        </span>
        <p className="text-lg font-semibold">{label}</p>
        <p className="text-sm text-muted-foreground">{acceptHint}</p>
      </div>
    </div>,
    document.body,
  );
}

// click-to-browse + drag & drop file picker, single file only. with
// dropAnywhere the file can be dropped anywhere on the page, not just here
export function FileDropZone({
  accept,
  icon,
  label,
  onFile,
  disabled,
  dropAnywhere = false,
}: {
  accept: string;
  icon: IconSvgElement;
  label: string;
  onFile: (file: File) => void;
  disabled?: boolean;
  dropAnywhere?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file: File | undefined) => {
    if (file && isFileAccepted(file, accept)) onFile(file);
  };
  const isDraggingOverWindow = useWindowFileDrag(
    dropAnywhere && !disabled,
    handleFile,
  );

  return (
    <>
      {isDraggingOverWindow && (
        <WindowDropOverlay
          {...{ icon }}
          label="Drop it anywhere"
          acceptHint={formatAcceptHint(accept)}
        />
      )}
      <button
        type="button"
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={(e) => {
          // leaving into our own icon/label isn't leaving the zone
          const isStillInside =
            e.relatedTarget instanceof Node &&
            e.currentTarget.contains(e.relatedTarget);
          if (!isStillInside) setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          // or the window listener (dropAnywhere) picks up the same drop again
          e.stopPropagation();
          setDragOver(false);
          if (!disabled) handleFile(e.dataTransfer.files[0]);
        }}
        onClick={() => inputRef.current?.click()}
        {...{ disabled }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed p-6 text-center text-sm text-muted-foreground transition-colors",
          dragOver
            ? "border-primary bg-primary/5 text-foreground"
            : "border-border hover:bg-muted/50",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <Icon {...{ icon }} className="size-6" />
        {label}
        <input
          ref={inputRef}
          type="file"
          {...{ accept }}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </button>
    </>
  );
}
