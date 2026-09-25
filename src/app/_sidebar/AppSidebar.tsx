"use client";

import { SidebarLeftIcon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/Tooltip";
import { Button } from "@/shadcn/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  useSidebar,
} from "@/shadcn/ui/sidebar";
import { cn } from "@/shadcn/utils";
import { APP_INFO, AppIcon, NAV_ITEMS } from "./nav";

// text stays mounted and never shrinks (fixed width + nowrap), it just fades
// while the sidebar clips it. collapsing fades out fast so the moving toggle
// never slides over visible text, expanding waits a beat before fading back in
const FADE_ON_COLLAPSE =
  "transition-opacity duration-150 delay-100 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:delay-0 group-data-[collapsible=icon]:duration-75";

// both sidebar widths are fixed, so both toggle spots are known up front:
// right end of the header when expanded (content is 200px, button 32px) and
// under the app icon when collapsed. same duration + easing as the width
// transition, so it stays glued to the shrinking edge the whole way
const TOGGLE_POSITION =
  "translate-x-42 group-data-[collapsible=icon]:translate-x-0 group-data-[collapsible=icon]:translate-y-10";

function SidebarToggle() {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      onClick={toggleSidebar}
      className={cn(
        "absolute top-0 left-0 text-sidebar-foreground/60 transition-[translate,background-color,color] duration-(--sidebar-duration) ease-(--sidebar-ease) hover:bg-sidebar-accent hover:text-sidebar-foreground",
        TOGGLE_POSITION,
      )}
    >
      <Icon
        icon={SidebarLeftIcon}
        className="size-4 transition-transform duration-(--sidebar-duration) group-data-[collapsible=icon]:rotate-180"
      />
    </Button>
  );
}

function NavLinks() {
  const pathname = usePathname();
  const { state } = useSidebar();

  return (
    <nav className="relative flex flex-col gap-1">
      <div
        aria-hidden
        className={cn(
          "absolute top-4 bottom-4 left-[15.5px] w-px bg-sidebar-border",
          FADE_ON_COLLAPSE,
        )}
      />
      {NAV_ITEMS.map(({ href, label, icon }) => {
        const isActive = pathname === href;
        return (
          <Tooltip key={href}>
            <TooltipTrigger asChild>
              <Link
                {...{ href }}
                aria-current={isActive ? "page" : undefined}
                className="group/link relative flex h-8 items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
              >
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-lg ring-1 transition-colors corner-squircle",
                    isActive
                      ? "bg-sidebar-foreground text-sidebar ring-sidebar-foreground"
                      : "bg-sidebar text-sidebar-foreground/60 ring-sidebar-border group-hover/link:text-sidebar-foreground group-hover/link:ring-sidebar-foreground/25",
                  )}
                >
                  <Icon {...{ icon }} className="size-4" />
                </span>
                <span
                  className={cn(
                    "text-sm whitespace-nowrap",
                    isActive
                      ? "font-semibold"
                      : "font-medium text-sidebar-foreground/70 group-hover/link:text-sidebar-foreground",
                    FADE_ON_COLLAPSE,
                  )}
                >
                  {label}
                </span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" hidden={state !== "collapsed"}>
              {label}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}

export function AppSidebar() {
  return (
    <Sidebar variant="floating" collapsible="icon">
      <SidebarHeader className="p-3">
        <div className="relative h-8 transition-[height] duration-(--sidebar-duration) ease-(--sidebar-ease) group-data-[collapsible=icon]:h-18">
          <div className="flex items-center gap-3">
            <AppIcon />
            {/* mr-10 keeps clear of the toggle, the inner fixed width is what
            stops the text from wrapping or re-truncating while it shrinks */}
            <div className="mr-10 min-w-0 flex-1 overflow-hidden">
              <div className={cn("w-29 leading-tight", FADE_ON_COLLAPSE)}>
                <p className="truncate text-sm font-semibold">
                  {APP_INFO.name}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/60">
                  {APP_INFO.description}
                </p>
              </div>
            </div>
          </div>
          <SidebarToggle />
        </div>
      </SidebarHeader>
      <SidebarContent className="px-3 py-2">
        <NavLinks />
      </SidebarContent>
    </Sidebar>
  );
}
