"use client";

import { Search01Icon, SidebarLeftIcon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Kbd } from "@/components/Kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/Tooltip";
import { Badge } from "@/shadcn/ui/badge";
import { Button } from "@/shadcn/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  useSidebar,
} from "@/shadcn/ui/sidebar";
import { cn } from "@/shadcn/utils";
import { triggerHaptic } from "@/utils/haptics";
import { useOpenCommandPalette } from "../_command/CommandPalette";
import { NavLinkIcon } from "./NavLinkIcon";
import { APP_INFO, AppIcon, getNavTransitionTypes, NAV_ITEMS } from "./nav";

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

  // the wrapper does the moving, not the Button: buttonVariants has an
  // active:translate-y-px press nudge that would overwrite this translate on
  // mousedown and yank the button out from under the cursor mid click
  return (
    <div
      className={cn(
        "absolute top-0 left-0 transition-[translate] duration-(--sidebar-duration) ease-(--sidebar-ease)",
        TOGGLE_POSITION,
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        onClick={() => {
          triggerHaptic("selection");
          toggleSidebar();
        }}
        className="text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
      >
        <Icon
          icon={SidebarLeftIcon}
          className="size-4 transition-transform duration-(--sidebar-duration) group-data-[collapsible=icon]:rotate-180"
        />
      </Button>
    </div>
  );
}

const NAV_ROW_CLASS =
  "flex h-8 items-center gap-2 overflow-hidden rounded-lg px-2 text-sm whitespace-nowrap outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring";

// looks like a nav row, opens the command palette (same as mod+k)
function SearchRow() {
  const openCommandPalette = useOpenCommandPalette();
  const { state } = useSidebar();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={openCommandPalette}
          className={cn(
            NAV_ROW_CLASS,
            "w-full font-medium text-sidebar-foreground/70",
          )}
        >
          <Icon icon={Search01Icon} className="size-4 shrink-0" />
          <span className={FADE_ON_COLLAPSE}>Search</span>
          <Kbd
            keys={["mod", "k"]}
            className={cn("ml-auto", FADE_ON_COLLAPSE)}
          />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        hidden={state !== "collapsed"}
        className="flex items-center gap-2"
      >
        Search
        <Kbd keys={["mod", "k"]} />
      </TooltipContent>
    </Tooltip>
  );
}

function NavLinks() {
  const pathname = usePathname();
  const { state } = useSidebar();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, label, icon, badge }) => {
        const isActive = pathname === href;
        return (
          <Tooltip key={href}>
            <TooltipTrigger asChild>
              <Link
                {...{ href }}
                transitionTypes={getNavTransitionTypes(pathname, href)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  NAV_ROW_CLASS,
                  isActive
                    ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                    : "font-medium text-sidebar-foreground/70",
                )}
              >
                <NavLinkIcon {...{ icon }} className="size-4 shrink-0" />
                <span className={FADE_ON_COLLAPSE}>{label}</span>
                {badge ? (
                  <Badge
                    variant="secondary"
                    className={cn("ml-auto", FADE_ON_COLLAPSE)}
                  >
                    {badge}
                  </Badge>
                ) : null}
              </Link>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              hidden={state !== "collapsed"}
              className="flex items-center gap-2"
            >
              {label}
              {badge ? <Badge variant="secondary">{badge}</Badge> : null}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}

export function AppSidebar() {
  const { isMobile } = useSidebar();
  // phones have MobileTopBar, without this ctrl+b would open shadcn's own
  // mobile sheet as a second competing menu
  if (isMobile) return null;

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
      <SidebarContent className="gap-1 px-3 py-2">
        <SearchRow />
        <NavLinks />
      </SidebarContent>
    </Sidebar>
  );
}
