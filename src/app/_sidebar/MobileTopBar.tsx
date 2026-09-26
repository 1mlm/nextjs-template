"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import { cn } from "@/shadcn/utils";
import { triggerHaptic } from "@/utils/haptics";
import { MenuSheet } from "./MenuSheet";
import { NAV_ITEMS } from "./nav";

const MAX_TABS = 4;

const TAB_CLASS =
  "flex flex-1 flex-col items-center gap-0.5 py-2 text-[0.65rem] font-medium transition-colors active:scale-95";

// up to 4 pages fit as tabs, past that the bar keeps 3 so "More" still has
// room, the rest are only reachable from the menu sheet
const getTabItems = () =>
  NAV_ITEMS.length > MAX_TABS ? NAV_ITEMS.slice(0, MAX_TABS - 1) : NAV_ITEMS;

// phones get a tab bar at the top instead of the sidebar, "More" opens the
// full menu sheet (every page, profile, log out)
export function MobileTopBar() {
  const pathname = usePathname();
  const tabItems = getTabItems();

  return (
    <nav className="sticky top-2 z-20 m-2 flex rounded-2xl bg-sidebar/90 px-1 text-sidebar-foreground ring-1 ring-sidebar-border backdrop-blur-sm corner-squircle md:hidden">
      {tabItems.map(({ href, label, icon, badge }) => (
        <Link
          key={href}
          {...{ href }}
          onClick={() => triggerHaptic("selection")}
          aria-current={pathname === href ? "page" : undefined}
          className={cn(
            TAB_CLASS,
            pathname !== href && "text-sidebar-foreground/60",
          )}
        >
          <span className="relative">
            <Icon {...{ icon }} className="size-5" />
            {badge ? (
              <span className="absolute -top-1.5 -right-2.5 grid h-4 min-w-4 place-items-center rounded-full bg-sidebar-accent px-1 text-[0.6rem] text-sidebar-accent-foreground">
                {badge}
              </span>
            ) : null}
          </span>
          {label}
        </Link>
      ))}
      <MenuSheet tabClassName={TAB_CLASS} />
    </nav>
  );
}
