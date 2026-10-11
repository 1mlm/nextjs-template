"use client";

import { SmileIcon } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { ResponsivePopover } from "@/components/ResponsivePopover";
import { Input } from "@/shadcn/ui/input";
import { cn } from "@/shadcn/utils";

export type IconGroup = { label: string; ids: string[] };

// one button that opens a searchable icon grid. `icons` maps the id you store
// to the icon to draw, `groups` splits the grid under small headings (leave it
// out for one flat grid of every icon)
export function IconPicker({
  value,
  onChange,
  icons,
  groups,
  title = "Choose icon",
}: {
  value: string;
  onChange: (iconId: string) => void;
  icons: Record<string, IconSvgElement>;
  groups?: IconGroup[];
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const matchesQuery = (id: string) =>
    id.toLowerCase().includes(query.trim().toLowerCase());
  const visibleGroups = (groups ?? [{ label: "", ids: Object.keys(icons) }])
    .map((group) => ({ ...group, ids: group.ids.filter(matchesQuery) }))
    .filter((group) => group.ids.length > 0);

  return (
    <ResponsivePopover
      {...{ open, title }}
      icon={SmileIcon}
      align="start"
      className="flex w-72 flex-col gap-2 max-md:w-auto max-md:px-4 max-md:pb-6"
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (isOpen) setQuery("");
      }}
      trigger={
        <button
          type="button"
          aria-label={title}
          className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted"
        >
          <Icon icon={icons[value] ?? SmileIcon} />
        </button>
      }
    >
      <Input
        placeholder="Search icons..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="h-8"
      />
      <div className="flex max-h-64 flex-col gap-3 overflow-y-auto">
        {visibleGroups.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No icon matches
          </p>
        )}
        {visibleGroups.map((group) => (
          <div key={group.label} className="flex flex-col gap-1.5">
            {group.label && (
              <span className="text-xs font-medium text-muted-foreground">
                {group.label}
              </span>
            )}
            <div className="flex flex-wrap gap-1.5">
              {group.ids.map((iconId) => (
                <button
                  key={iconId}
                  type="button"
                  aria-label={iconId}
                  title={iconId}
                  onClick={() => {
                    onChange(iconId);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-md border",
                    value === iconId
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  <Icon icon={icons[iconId] ?? SmileIcon} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ResponsivePopover>
  );
}
