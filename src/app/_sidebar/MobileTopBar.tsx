"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/shadcn/utils";
import { triggerHaptic } from "@/utils/haptics";
import { MenuSheet } from "./MenuSheet";
import { NavLinkIcon } from "./NavLinkIcon";
import { getNavTransitionTypes, NAV_ITEMS } from "./nav";

const MAX_TABS = 4;

const TAB_CLASS =
  "flex flex-1 flex-col items-center gap-0.5 py-2 text-[0.65rem] font-medium transition-colors active:scale-95";

// up to 4 pages fit as tabs, past that the bar keeps 3 so "More" still has
// room, the rest are only reachable from the menu sheet
const getTabItems = () =>
  NAV_ITEMS.length > MAX_TABS ? NAV_ITEMS.slice(0, MAX_TABS - 1) : NAV_ITEMS;

// under this nothing hides, the page top always has the bar. the jitter
// threshold ignores tiny scrolls (and ios rubber banding) flipping it back
const ALWAYS_SHOWN_ABOVE_PX = 64;
const SCROLL_JITTER_PX = 8;

// like most phone apps, scrolling down to read tucks the bar away and any
// scroll back up brings it right back
function useIsHiddenWhileScrollingDown() {
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const updateOnScroll = () => {
      const scrollY = window.scrollY;
      const delta = scrollY - lastScrollY.current;
      if (Math.abs(delta) < SCROLL_JITTER_PX) return;
      setIsHidden(delta > 0 && scrollY > ALWAYS_SHOWN_ABOVE_PX);
      lastScrollY.current = scrollY;
    };
    window.addEventListener("scroll", updateOnScroll, { passive: true });
    return () => window.removeEventListener("scroll", updateOnScroll);
  }, []);

  return isHidden;
}

// phones get a tab bar at the top instead of the sidebar, "More" opens the
// full menu sheet (every page, profile, log out)
export function MobileTopBar() {
  const pathname = usePathname();
  const tabItems = getTabItems();
  const isHidden = useIsHiddenWhileScrollingDown();

  return (
    <nav
      className={cn(
        "sticky top-2 z-20 m-2 flex rounded-2xl bg-sidebar/90 px-1 text-sidebar-foreground ring-1 ring-sidebar-border backdrop-blur-sm transition-transform duration-300 ease-out corner-squircle focus-within:translate-y-0 motion-reduce:transition-none md:hidden",
        isHidden && "-translate-y-[calc(100%+1rem)]",
      )}
    >
      {tabItems.map(({ href, label, icon, badge }) => (
        <Link
          key={href}
          {...{ href }}
          transitionTypes={getNavTransitionTypes(pathname, href)}
          onClick={() => triggerHaptic("selection")}
          aria-current={pathname === href ? "page" : undefined}
          className={cn(
            TAB_CLASS,
            pathname !== href && "text-sidebar-foreground/60",
          )}
        >
          <span className="relative">
            <NavLinkIcon {...{ icon }} className="size-5" />
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
