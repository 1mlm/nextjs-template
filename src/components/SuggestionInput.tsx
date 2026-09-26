"use client";

import { CornerDownLeftIcon, HistoryIcon } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { type ComponentProps, useState } from "react";
import { Icon } from "@/components/Icon";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/shadcn/ui/input-group";
import { Popover, PopoverAnchor, PopoverContent } from "@/shadcn/ui/popover";
import { cn } from "@/shadcn/utils";

const MAX_SUGGESTIONS = 6;

const getMatches = (suggestions: string[], query: string) => {
  const trimmed = query.trim().toLowerCase();
  return suggestions
    .filter((suggestion) => {
      const lowered = suggestion.toLowerCase();
      return lowered.includes(trimmed) && lowered !== trimmed;
    })
    .slice(0, MAX_SUGGESTIONS);
};

// bolds the part of the suggestion you already typed
function HighlightedMatch({ text, query }: { text: string; query: string }) {
  const start = text.toLowerCase().indexOf(query.trim().toLowerCase());
  if (!query.trim() || start === -1) return text;
  const end = start + query.trim().length;
  return (
    <>
      {text.slice(0, start)}
      <span className="font-semibold text-foreground">
        {text.slice(start, end)}
      </span>
      {text.slice(end)}
    </>
  );
}

// free text input that offers past values under it, a styleable stand in for
// <datalist> (chrome draws that one itself, ignoring fonts and theme). the
// dropdown never takes focus so typing just keeps going, arrows + enter pick
export function SuggestionInput({
  value,
  onValueChange,
  suggestions,
  icon,
  className,
  ...inputProps
}: Omit<ComponentProps<typeof InputGroupInput>, "value" | "onChange"> & {
  value: string;
  onValueChange: (value: string) => void;
  suggestions: string[];
  icon: IconSvgElement;
}) {
  const [isFocused, setIsFocused] = useState(false);
  // escape hides the list until you type again, focus never actually left
  const [isDismissed, setIsDismissed] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const matches = getMatches(suggestions, value);
  const isOpen = isFocused && !isDismissed && matches.length > 0;

  const pickSuggestion = (suggestion: string) => {
    onValueChange(suggestion);
    setHighlightedIndex(0);
  };

  const moveHighlight = (step: number) =>
    setHighlightedIndex(
      (current) => (current + step + matches.length) % matches.length,
    );

  return (
    <Popover open={isOpen}>
      <PopoverAnchor asChild>
        <InputGroup {...{ className }}>
          <InputGroupAddon>
            <Icon {...{ icon }} />
          </InputGroupAddon>
          <InputGroupInput
            {...inputProps}
            {...{ value }}
            autoComplete="off"
            role="combobox"
            aria-expanded={isOpen}
            aria-autocomplete="list"
            onChange={(event) => {
              onValueChange(event.target.value);
              setIsDismissed(false);
              setHighlightedIndex(0);
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(event) => {
              if (!isOpen) return;
              if (event.key === "ArrowDown") moveHighlight(1);
              else if (event.key === "ArrowUp") moveHighlight(-1);
              else if (event.key === "Enter")
                pickSuggestion(matches[highlightedIndex]);
              else if (event.key === "Escape") setIsDismissed(true);
              else return;
              event.preventDefault();
            }}
          />
        </InputGroup>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="w-(--radix-popover-trigger-width) p-1"
      >
        <div role="listbox" className="flex flex-col">
          {matches.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              role="option"
              aria-selected={index === highlightedIndex}
              // mousedown would blur the input and close this before the click lands
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => pickSuggestion(suggestion)}
              onPointerEnter={() => setHighlightedIndex(index)}
              className={cn(
                "group/suggestion flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground corner-squircle max-md:py-2.5",
                index === highlightedIndex && "bg-muted",
              )}
            >
              <Icon icon={HistoryIcon} className="size-3.5 shrink-0" />
              <span className="min-w-0 flex-1 truncate">
                <HighlightedMatch text={suggestion} query={value} />
              </span>
              <Icon
                icon={CornerDownLeftIcon}
                className="size-3.5 shrink-0 opacity-0 group-aria-selected/suggestion:opacity-100 pointer-coarse:hidden"
              />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
