"use client";

import {
  Cancel01Icon,
  Logout01Icon,
  MoreHorizontalIcon,
  Search01Icon,
  SmartPhone01Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
import { version } from "../../../package.json";
import { useOpenCommandPalette } from "../_command/CommandPalette";
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

// chrome's "add to home screen" prompt, which it only offers once the
// manifest checks out. safari never fires it, the button just never shows
type InstallPromptEvent = Event & { prompt: () => Promise<void> };

const isInstallPromptEvent = (event: Event): event is InstallPromptEvent =>
  "prompt" in event;

function useInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent>();

  useEffect(() => {
    const keepPrompt = (event: Event) => {
      if (!isInstallPromptEvent(event)) return;
      event.preventDefault();
      setInstallEvent(event);
    };
    const forgetPrompt = () => setInstallEvent(undefined);
    window.addEventListener("beforeinstallprompt", keepPrompt);
    window.addEventListener("appinstalled", forgetPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", keepPrompt);
      window.removeEventListener("appinstalled", forgetPrompt);
    };
  }, []);

  // chrome only lets one event prompt once, so the row goes away after
  const install = installEvent
    ? async () => {
        await installEvent.prompt();
        setInstallEvent(undefined);
      }
    : undefined;

  return install;
}

// a vaul drawer (drag it down to close, like ios sheets) that's itself
// transparent, the visible part is a card inset from the screen edges so it
// floats instead of being glued to the bottom
export function MenuSheet({ tabClassName }: { tabClassName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const install = useInstallPrompt();
  const openCommandPalette = useOpenCommandPalette();

  const openSearch = () => {
    setOpen(false);
    openCommandPalette();
  };

  const closeMenu = () => {
    triggerHaptic("selection");
    setOpen(false);
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
                <Icon icon={Search01Icon} className="size-3.5" />
              </button>
              <DrawerClose
                aria-label="Close menu"
                className={HEADER_BUTTON_CLASS}
              >
                <Icon icon={Cancel01Icon} className="size-3.5" />
              </DrawerClose>
            </span>
          </div>

          <nav className="grid grid-cols-2 gap-1.5 [&>*:last-child:nth-child(odd)]:col-span-2">
            {NAV_ITEMS.map(({ href, label, icon }) => (
              <Link
                key={href}
                {...{ href }}
                transitionTypes={getNavTransitionTypes(pathname, href)}
                onClick={closeMenu}
                aria-current={pathname === href ? "page" : undefined}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors active:scale-[0.97]",
                  pathname === href
                    ? "bg-sidebar-accent font-semibold"
                    : "text-sidebar-foreground/70 ring-1 ring-sidebar-border hover:bg-sidebar-accent",
                )}
              >
                <Icon {...{ icon }} className="size-4" />
                {label}
              </Link>
            ))}
          </nav>

          {install && (
            <button
              type="button"
              onClick={install}
              className="flex items-center gap-2.5 rounded-lg bg-sidebar-accent p-2.5 text-left transition-colors active:scale-[0.98]"
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
              <Icon icon={Logout01Icon} className="size-4" />
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
