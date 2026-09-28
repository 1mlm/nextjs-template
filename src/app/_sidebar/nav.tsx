import {
  Cursor01Icon,
  Home01Icon,
  PuzzleIcon,
  TablePropertiesIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

// the one place a fork renames the app and edits the sidebar links
export const APP_INFO = {
  name: "nextjs-template",
  description: "starter kit",
};

// no auth in the template, a fork swaps this for the real session user
export const DEMO_USER = {
  name: "Malik",
  handle: "@1mlm",
  email: "malik@example.com",
  avatarUrl: "https://github.com/1mlm.png",
  profileUrl: "https://github.com/1mlm",
  plan: "Pro",
};

// decoration for the menu footer, nobody is ever reading these lol
export const LEGAL_LINKS = [
  { label: "Terms", tooltip: "Never" },
  { label: "Privacy", tooltip: "Never ever" },
];

export const NAV_ITEMS: {
  href: string;
  label: string;
  icon: IconSvgElement;
  badge?: number;
}[] = [
  { href: "/", label: "Home", icon: Home01Icon },
  { href: "/showcase", label: "Showcase", icon: Cursor01Icon },
  { href: "/table", label: "Table", icon: TablePropertiesIcon },
  { href: "/blocks", label: "Blocks", icon: PuzzleIcon },
];

const getNavIndex = (path: string) =>
  NAV_ITEMS.findIndex(({ href }) => href === path);

// going down the nav list slides the page forward, going back up slides it
// back, so the motion matches where the link sits (see page transitions in
// globals.css). pages outside the list just crossfade
export const getNavTransitionTypes = (
  currentPath: string,
  targetHref: string,
) =>
  getNavIndex(targetHref) > getNavIndex(currentPath)
    ? ["nav-forward"]
    : ["nav-back"];

export function AppIcon() {
  return (
    // biome-ignore lint/performance/noImgElement: same icon.svg the favicon uses, so they never drift
    <img src="/icon.svg" alt="" draggable={false} className="size-8 shrink-0" />
  );
}
