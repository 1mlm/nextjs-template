"use client";

import type { IconSvgElement } from "@hugeicons/react";
import type { ComponentProps, ReactNode, RefObject } from "react";
import { IconChip } from "@/components/IconChip";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/shadcn/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shadcn/ui/sheet";

type PopoverContentProps = ComponentProps<typeof PopoverContent>;

// popover on desktop, bottom sheet on phones. a popover near a screen edge
// just gets clipped on a narrow screen (and tiny floating boxes feel bad on
// touch anyway), a sheet from the bottom is the obvious thumb-friendly version.
// `title` + `icon` only show in the sheet header, the title is also what
// screen readers announce
export function ResponsivePopover({
  open,
  onOpenChange,
  trigger,
  title,
  icon,
  side = "bottom",
  align = "center",
  sideOffset,
  anchorRef,
  children,
  className,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger: ReactNode;
  title: string;
  icon: IconSvgElement;
  side?: PopoverContentProps["side"];
  align?: PopoverContentProps["align"];
  sideOffset?: number;
  // pin the popover to this element instead of the trigger (desktop only)
  anchorRef?: RefObject<HTMLElement | null>;
  children: ReactNode;
  className?: string;
}) {
  const isMobile = useIsMobile();

  if (isMobile)
    return (
      <Sheet {...{ open, onOpenChange }}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl"
          aria-describedby={undefined}
        >
          <SheetHeader className="flex-row items-center gap-2.5">
            <IconChip {...{ icon }} />
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          <div className={className ?? "px-4 pb-6"}>{children}</div>
        </SheetContent>
      </Sheet>
    );

  return (
    <Popover {...{ open, onOpenChange }}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      {anchorRef && (
        // radix wants a ref that's never null, this one reads the element late
        <PopoverAnchor
          virtualRef={{
            current: {
              getBoundingClientRect: () =>
                anchorRef.current?.getBoundingClientRect() ?? new DOMRect(),
            },
          }}
        />
      )}
      <PopoverContent
        {...{ side, align, sideOffset, className }}
        aria-label={title}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}
