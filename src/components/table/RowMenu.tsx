"use client";

import { CheckmarkCircle02Icon, Copy01Icon } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useContext,
  useState,
} from "react";
import { Icon } from "@/components/Icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import { cn } from "@/shadcn/utils";
import { useCopyToClipboard } from "@/utils/clipboard";

const COPY_FEEDBACK_MS = 650;

// lets a menu item (copy, share) hold the menu open for a sec instead of the
// instant close every DropdownMenuItem does, so it can flash "copied" in place
// instead of a toast popping up somewhere random
const RowMenuCloseContext = createContext<(() => void) | null>(null);

function useRowMenuClose() {
  const close = useContext(RowMenuCloseContext);
  if (!close) throw new Error("useRowMenuClose must be used inside a RowMenu");
  return close;
}

// for items that open their own dialog/popover. a real DropdownMenuItem closes
// AND unmounts the whole menu on select, which kills the nested dialog with it
// (fun one to debug). so this is a plain button styled like a menu item.
// it's always an asChild trigger, and asChild clobbers data-slot/className in
// weird ways, so it's styled with its own classes, no data-slot selectors
export function RowMenuItemButton({
  icon,
  children,
  className,
  ...props
}: ComponentProps<"button"> & { icon: IconSvgElement }) {
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
// popping a toast, a toast draws the eye away from the row that was just
// acted on, this keeps the feedback right where the click happened
export function CopyMenuItem({
  value,
  icon = Copy01Icon,
  label,
  copiedLabel,
  copiedIcon = CheckmarkCircle02Icon,
}: {
  value: string;
  icon?: IconSvgElement;
  label: string;
  copiedLabel: string;
  copiedIcon?: IconSvgElement;
}) {
  const closeMenu = useRowMenuClose();
  const { copied, copy } = useCopyToClipboard(COPY_FEEDBACK_MS);

  return (
    <DropdownMenuItem
      onSelect={async (event) => {
        event.preventDefault();
        const didCopy = await copy(value);
        if (didCopy) setTimeout(closeMenu, COPY_FEEDBACK_MS);
      }}
    >
      <Icon icon={copied ? copiedIcon : icon} />
      {copied ? copiedLabel : label}
    </DropdownMenuItem>
  );
}

// visible trailing "..." button for row actions, no hidden right click or long
// press to discover, same on desktop and mobile. drop it in a buttons-type column
export function RowMenu({
  children,
  ariaLabel,
  icon,
}: {
  children: ReactNode;
  ariaLabel: string;
  icon: IconSvgElement;
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
