"use client";

import { CheckmarkCircle02Icon, Copy01Icon } from "@hugeicons/core-free-icons";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useContext,
  useState,
} from "react";
import { type HugeIcon, Icon } from "@/components/Icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import { cn } from "@/shadcn/utils";
import { copyToClipboard } from "@/utils/clipboard";

const COPY_FEEDBACK_MS = 650;

// lets a menu item (Copy/Share) delay the menu's close instead of the
// instant close-on-select every real DropdownMenuItem gets by default —
// used to show a brief "copied" state in place before the menu goes away,
// instead of a toast popping up somewhere else on screen
const RowMenuCloseContext = createContext<(() => void) | null>(null);

function useRowMenuClose() {
  const close = useContext(RowMenuCloseContext);
  if (!close) {
    throw new Error("useRowMenuClose must be used inside a RowMenu");
  }
  return close;
}

// a row menu item that must stay mounted after being clicked (it opens a
// nested Dialog/Popover of its own) can't be a real DropdownMenuItem —
// selecting one closes and unmounts the whole menu content, which would tear
// down the nested dialog's state along with it. This is styled to match
// DropdownMenuItem but is a plain button so clicking it doesn't trigger that
// close-and-unmount behavior. It's always used as a Dialog/PopoverTrigger's
// asChild target, which clones it and overwrites its own data-slot/className
// merge in ways that make it unreliable to target from outside CSS — styled
// entirely with its own classes instead, no data-slot dependency
export function RowMenuItemButton({
  icon,
  children,
  className,
  ...props
}: ComponentProps<"button"> & { icon: HugeIcon }) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-sm outline-hidden select-none hover:bg-foreground/10 focus:bg-foreground/10 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <Icon {...{ icon }} />
      {children}
    </button>
  );
}

// swaps its own icon/label to a checkmark/feedback label in place instead of
// popping a toast — a toast draws the eye away from the row that was just
// acted on, this keeps the feedback right where the click happened
export function CopyMenuItem({
  value,
  icon = Copy01Icon,
  label,
  copiedLabel,
  copiedIcon = CheckmarkCircle02Icon,
}: {
  value: string;
  icon?: HugeIcon;
  label: string;
  copiedLabel: string;
  copiedIcon?: HugeIcon;
}) {
  const closeMenu = useRowMenuClose();
  const [copied, setCopied] = useState(false);

  return (
    <DropdownMenuItem
      onSelect={(event) => {
        event.preventDefault();
        copyToClipboard(value);
        setCopied(true);
        setTimeout(closeMenu, COPY_FEEDBACK_MS);
      }}
    >
      <Icon icon={copied ? copiedIcon : icon} />
      {copied ? copiedLabel : label}
    </DropdownMenuItem>
  );
}

// an explicit trailing "..." button column for row actions — no hidden
// right-click/long-press gesture to discover, works the same on desktop and
// mobile. Drop this inside a "buttons"-type CustomTableColumn
export function RowMenu({
  children,
  ariaLabel,
  icon,
}: {
  children: ReactNode;
  ariaLabel: string;
  icon: HugeIcon;
}) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu {...{ open }} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className="flex size-7 items-center justify-center rounded-md hover:bg-foreground/10 focus:bg-foreground/10 focus-visible:outline-hidden data-open:bg-foreground/10"
        >
          <Icon {...{ icon }} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <RowMenuCloseContext.Provider value={() => setOpen(false)}>
          {children}
        </RowMenuCloseContext.Provider>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
