"use client";

import type { ComponentProps, ReactNode } from "react";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
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
// `title` only shows in the sheet, it's also what screen readers announce
export function ResponsivePopover({
  open,
  onOpenChange,
  trigger,
  title,
  side = "bottom",
  align = "center",
  children,
  className,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger: ReactNode;
  title: string;
  side?: PopoverContentProps["side"];
  align?: PopoverContentProps["align"];
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
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          <div className={className ?? "px-4 pb-6"}>{children}</div>
        </SheetContent>
      </Sheet>
    );

  return (
    <Popover {...{ open, onOpenChange }}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent {...{ side, align, className }} aria-label={title}>
        {children}
      </PopoverContent>
    </Popover>
  );
}
