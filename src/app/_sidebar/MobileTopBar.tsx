"use client";

import { Menu01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shadcn/ui/sheet";
import { cn } from "@/shadcn/utils";
import { APP_INFO, AppIcon, NAV_ITEMS } from "./nav";

// phones get a top bar instead of the sidebar, the menu opens as a bottom
// sheet with the pages as a 2 column grid (odd one out spans the full row)
export function MobileTopBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-2 z-20 m-2 flex items-center justify-between rounded-xl bg-sidebar py-2 pr-2 pl-3 text-sidebar-foreground ring-1 ring-sidebar-border corner-squircle md:hidden">
      <span className="flex items-center gap-2.5">
        <AppIcon />
        <span className="text-sm font-semibold">{APP_INFO.name}</span>
      </span>
      <Sheet {...{ open }} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open menu">
            <Icon icon={Menu01Icon} className="size-4" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl"
          aria-describedby={undefined}
        >
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <nav className="grid grid-cols-2 gap-2 px-4 pb-6 [&>*:last-child:nth-child(odd)]:col-span-2">
            {NAV_ITEMS.map(({ href, label, icon }) => (
              <Link
                key={href}
                {...{ href }}
                onClick={() => setOpen(false)}
                aria-current={pathname === href ? "page" : undefined}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ring-1 transition-colors corner-squircle active:scale-[0.97]",
                  pathname === href
                    ? "bg-foreground text-background ring-foreground"
                    : "ring-border hover:bg-muted",
                )}
              >
                <Icon {...{ icon }} className="size-4" />
                {label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
