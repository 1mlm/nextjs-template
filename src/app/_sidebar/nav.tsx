import { ANIMATED_APP_ICONS } from "@/utils/animated-icons";
import { APP_ICONS } from "@/utils/icons";

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

const NAV_LINKS: {
  href: string;
  label: string;
  concept: keyof typeof ANIMATED_APP_ICONS;
  badge?: number;
}[] = [
  { href: "/showcase", label: "Showcase", concept: "showcase" },
  { href: "/chat", label: "Chat", concept: "chat" },
  { href: "/table", label: "Table", concept: "table" },
  { href: "/blocks", label: "Blocks", concept: "blocks" },
];

// a link only names its icon concept, both the static icon (palette, sheet)
// and the animated one (sidebar, tab bar) come from the shared maps
export const NAV_ITEMS = NAV_LINKS.map((link) => ({
  ...link,
  icon: APP_ICONS[link.concept],
  animatedIcon: ANIMATED_APP_ICONS[link.concept],
}));

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
