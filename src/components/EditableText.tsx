"use client";

import { PencilEdit02Icon } from "@hugeicons/core-free-icons";
import { useRef, useState } from "react";
import { ErrorTooltip } from "@/components/ErrorTooltip";
import { Icon } from "@/components/Icon";
import { cn } from "@/shadcn/utils";
import { triggerHaptic } from "@/utils/haptics";

// text you click to edit in place, like a title in linear or notion. enter or
// clicking away saves, escape puts the old text back. onSave can throw, the
// text then reverts and the error sits next to it
export function EditableText({
  value,
  onSave,
  placeholder = "Untitled",
  className,
}: {
  value: string;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  className?: string;
}) {
  const [draft, setDraft] = useState<string>();
  // shown while saving so the new text sticks right away, dropped on error
  const [savingValue, setSavingValue] = useState<string>();
  const [error, setError] = useState<string>();
  const isEditing = draft !== undefined;
  const isSaving = savingValue !== undefined;
  const shownValue = savingValue ?? value;

  // enter and escape both just blur, blur is the one place editing ends.
  // escape flags it first so that blur throws the draft away instead
  const isCancelling = useRef(false);

  const save = async () => {
    if (isCancelling.current) {
      isCancelling.current = false;
      setDraft(undefined);
      return;
    }
    const trimmedDraft = draft?.trim();
    setDraft(undefined);
    if (!trimmedDraft || trimmedDraft === value) return;
    setSavingValue(trimmedDraft);
    setError(undefined);
    try {
      await onSave(trimmedDraft);
      triggerHaptic("success");
    } catch (saveError) {
      triggerHaptic("error");
      setError(
        saveError instanceof Error ? saveError.message : "Couldn't save that",
      );
    } finally {
      setSavingValue(undefined);
    }
  };

  if (isEditing)
    return (
      <input
        // biome-ignore lint/a11y/noAutofocus: the user just clicked to edit this, focus belongs here
        autoFocus
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onFocus={(event) => event.target.select()}
        onBlur={save}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key !== "Escape") return;
          isCancelling.current = true;
          event.currentTarget.blur();
        }}
        className={cn(
          "-mx-1.5 rounded-md bg-muted px-1.5 outline-none ring-2 ring-ring/50 corner-squircle",
          className,
        )}
      />
    );

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => setDraft(value)}
        disabled={isSaving}
        className={cn(
          "group/editable -mx-1.5 inline-flex items-center gap-1.5 rounded-md px-1.5 text-left transition-colors corner-squircle hover:bg-muted disabled:opacity-60",
          !shownValue && "text-muted-foreground",
          className,
        )}
      >
        {shownValue || placeholder}
        <Icon
          icon={PencilEdit02Icon}
          isLoading={isSaving}
          className={cn(
            "size-3.5 text-muted-foreground transition-opacity",
            !isSaving &&
              "opacity-0 group-hover/editable:opacity-100 group-focus-visible/editable:opacity-100 pointer-coarse:opacity-100",
          )}
        />
      </button>
      {error && <ErrorTooltip message={error} />}
    </span>
  );
}
