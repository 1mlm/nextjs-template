import {
  CubeIcon,
  GridViewIcon,
  Home01Icon,
  PuzzleIcon,
  Table01Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { IconChip } from "@/components/IconChip";

// the one place a fork renames the app and edits the sidebar links
export const APP_INFO = {
  name: "nextjs-template",
  description: "starter kit",
};

// no auth in the template, a fork swaps this for the real session user
export const DEMO_USER = {
  name: "Jane Doe",
  email: "jane@example.com",
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
  { href: "/showcase", label: "Showcase", icon: GridViewIcon },
  { href: "/table", label: "Table", icon: Table01Icon },
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
    <IconChip icon={CubeIcon} className="bg-sidebar-foreground text-sidebar" />
  );
}
