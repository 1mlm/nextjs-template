"use client";

import {
  Cancel01Icon,
  Logout01Icon,
  MoreHorizontalIcon,
  SmartPhone01Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/Tooltip";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/shadcn/ui/sheet";
import { cn } from "@/shadcn/utils";
import { triggerHaptic } from "@/utils/haptics";
import { version } from "../../../package.json";
import {
  APP_INFO,
  AppIcon,
  DEMO_USER,
  getNavTransitionTypes,
  LEGAL_LINKS,
  NAV_ITEMS,
} from "./nav";

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2);

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

  return installEvent;
}

// the sheet itself is transparent, the visible part is a card inset from the
// screen edges so it floats instead of being glued to the bottom
export function MenuSheet({ tabClassName }: { tabClassName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const installEvent = useInstallPrompt();

  const closeMenu = () => {
    triggerHaptic("selection");
    setOpen(false);
  };

  return (
    <Sheet {...{ open }} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          onClick={() => triggerHaptic("selection")}
          className={cn(tabClassName, "text-sidebar-foreground/60")}
        >
          <Icon icon={MoreHorizontalIcon} className="size-5" />
          More
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        aria-describedby={undefined}
        className="border-none bg-transparent p-2 shadow-none"
      >
        <div className="flex flex-col gap-3 rounded-2xl bg-sidebar p-3.5 text-sidebar-foreground ring-1 ring-sidebar-border corner-squircle">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2.5">
              <AppIcon />
              <span className="leading-tight">
                <SheetTitle className="text-sm font-semibold">
                  {APP_INFO.name}
                </SheetTitle>
                <span className="text-xs text-sidebar-foreground/60">
                  {APP_INFO.description}
                </span>
              </span>
            </span>
            <SheetClose
              aria-label="Close menu"
              className="grid size-7 place-items-center rounded-full text-sidebar-foreground/60 ring-1 ring-sidebar-border transition-colors hover:text-sidebar-foreground active:scale-95"
            >
              <Icon icon={Cancel01Icon} className="size-3.5" />
            </SheetClose>
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
                  "flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors corner-squircle active:scale-[0.97]",
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

          {installEvent && (
            <button
              type="button"
              onClick={() => installEvent.prompt()}
              className="flex items-center gap-2.5 rounded-lg bg-sidebar-accent p-2.5 text-left transition-colors corner-squircle active:scale-[0.98]"
            >
              <span className="grid size-8 place-items-center rounded-lg bg-sidebar-foreground text-sidebar corner-squircle">
                <Icon icon={SmartPhone01Icon} className="size-4" />
              </span>
              <span className="leading-tight">
                <p className="text-sm font-semibold">Install the app</p>
                <p className="text-xs text-sidebar-foreground/60">
                  opens from your home screen, no browser bars
                </p>
              </span>
            </button>
          )}
          <div className="flex items-center gap-2.5 rounded-lg p-2.5 ring-1 ring-sidebar-border corner-squircle">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sidebar-accent text-xs font-semibold">
              {getInitials(DEMO_USER.name)}
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-semibold">{DEMO_USER.name}</p>
              <p className="truncate text-xs text-sidebar-foreground/60">
                {DEMO_USER.email}
              </p>
            </span>
            <button
              type="button"
              onClick={closeMenu}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-destructive transition-colors corner-squircle hover:bg-destructive/10 active:scale-95"
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
      </SheetContent>
    </Sheet>
  );
}
