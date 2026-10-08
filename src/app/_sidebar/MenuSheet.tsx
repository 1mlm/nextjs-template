"use client";

import {
  MoreHorizontalIcon,
  SmartPhone01Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { InstallSteps } from "@/components/device/InstallSteps";
import { useInstallPrompt } from "@/components/device/useInstallPrompt";
import { Icon } from "@/components/Icon";
import { IconChip } from "@/components/IconChip";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/Tooltip";
import { UserAvatar } from "@/components/UserAvatar";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/shadcn/ui/drawer";
import { cn } from "@/shadcn/utils";
import { triggerHaptic } from "@/utils/haptics";
import { APP_ICONS } from "@/utils/icons";
import { version } from "../../../package.json";
import { useOpenCommandPalette } from "../_command/CommandPalette";
import { NavLinkIcon } from "./NavLinkIcon";
import {
  APP_INFO,
  AppIcon,
  DEMO_USER,
  getNavTransitionTypes,
  LEGAL_LINKS,
  NAV_ITEMS,
} from "./nav";

const HEADER_BUTTON_CLASS =
  "grid size-7 place-items-center rounded-full text-sidebar-foreground/60 ring-1 ring-sidebar-border transition-colors hover:text-sidebar-foreground active:scale-95";

// a vaul drawer (drag it down to close, like ios sheets) that's itself
// transparent, the visible part is a card inset from the screen edges so it
// floats instead of being glued to the bottom
export function MenuSheet({ tabClassName }: { tabClassName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { install, manualInstallPlatform } = useInstallPrompt();
  const [showInstallSteps, setShowInstallSteps] = useState(false);
  const openCommandPalette = useOpenCommandPalette();

  const openSearch = () => {
    setOpen(false);
    openCommandPalette();
  };

  const closeMenu = () => {
    triggerHaptic("selection");
    setOpen(false);
  };

  // nav links keep the sheet open until the new page lands, so their
  // spinner has something to show while the page loads
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the trigger, not a value the effect reads
  useEffect(() => setOpen(false), [pathname]);

  const handleNavLinkClick = (href: string) => {
    if (href === pathname) return closeMenu();
    triggerHaptic("selection");
  };

  return (
    <Drawer {...{ open }} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          type="button"
          onClick={() => triggerHaptic("selection")}
          className={cn(tabClassName, "text-sidebar-foreground/60")}
        >
          <Icon icon={MoreHorizontalIcon} className="size-5" />
          More
        </button>
      </DrawerTrigger>
      {/* the drawer's own handle sits outside the card, so it's hidden and
      the card draws one inside itself. drag it down (or anywhere) to close */}
      <DrawerContent
        aria-describedby={undefined}
        className="border-none! bg-transparent p-2 [&>div:first-child]:hidden"
      >
        <div className="flex flex-col gap-3 rounded-2xl bg-sidebar p-3.5 pt-2 text-sidebar-foreground ring-1 ring-sidebar-border">
          <span className="mx-auto h-1 w-10 rounded-full bg-sidebar-foreground/20" />
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2.5">
              <AppIcon />
              <span className="leading-tight">
                <DrawerTitle className="text-sm font-semibold">
                  {APP_INFO.name}
                </DrawerTitle>
                <span className="text-xs text-sidebar-foreground/60">
                  {APP_INFO.description}
                </span>
              </span>
            </span>
            <span className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Search"
                onClick={openSearch}
                className={HEADER_BUTTON_CLASS}
              >
                <Icon icon={APP_ICONS.search} className="size-3.5" />
              </button>
              <DrawerClose
                aria-label="Close menu"
                className={HEADER_BUTTON_CLASS}
              >
                <Icon icon={APP_ICONS.close} className="size-3.5" />
              </DrawerClose>
            </span>
          </div>

          <nav className="grid grid-cols-2 gap-1.5 [&>*:last-child:nth-child(odd)]:col-span-2">
            {NAV_ITEMS.map(({ href, label, icon, animatedIcon }) => (
              <Link
                key={href}
                {...{ href }}
                transitionTypes={getNavTransitionTypes(pathname, href)}
                onClick={() => handleNavLinkClick(href)}
                aria-current={pathname === href ? "page" : undefined}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors active:scale-[0.97]",
                  pathname === href
                    ? "bg-sidebar-accent font-semibold"
                    : "text-sidebar-foreground/70 ring-1 ring-sidebar-border hover:bg-sidebar-accent",
                )}
              >
                <NavLinkIcon {...{ icon, animatedIcon }} size={16} />
                {label}
              </Link>
            ))}
          </nav>

          {(install || manualInstallPlatform) && (
            <div className="flex flex-col gap-3 rounded-lg bg-sidebar-accent p-2.5">
              <button
                type="button"
                onClick={
                  install ?? (() => setShowInstallSteps(!showInstallSteps))
                }
                className="flex items-center gap-2.5 text-left transition-transform active:scale-[0.98]"
              >
                <IconChip
                  icon={SmartPhone01Icon}
                  className="bg-sidebar-foreground text-sidebar"
                />
                <span className="leading-tight">
                  <p className="text-sm font-semibold">Install the app</p>
                  <p className="text-xs text-sidebar-foreground/60">
                    opens from your home screen, no browser bars
                  </p>
                </span>
              </button>
              {showInstallSteps && manualInstallPlatform && (
                <InstallSteps platform={manualInstallPlatform} />
              )}
            </div>
          )}
          <div className="flex items-center gap-2.5 rounded-lg p-2.5 ring-1 ring-sidebar-border">
            <UserAvatar name={DEMO_USER.name} src={DEMO_USER.avatarUrl} />
            <span className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-semibold">{DEMO_USER.name}</p>
              <p className="truncate text-xs text-sidebar-foreground/60">
                {DEMO_USER.handle}
              </p>
            </span>
            <button
              type="button"
              onClick={closeMenu}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 active:scale-95"
            >
              <Icon icon={APP_ICONS.logout} className="size-4" />
              Log out
            </button>
          </div>

          <div className="flex items-center justify-between px-0.5 text-[0.65rem] text-sidebar-foreground/50">
            <span className="flex items-center gap-2">
              {LEGAL_LINKS.map(({ label, tooltip }) => (
                <Tooltip key={label}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="underline-offset-2 hover:text-sidebar-foreground hover:underline"
                    >
                      {label}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{tooltip}</TooltipContent>
                </Tooltip>
              ))}
            </span>
            <span>v{version}</span>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
