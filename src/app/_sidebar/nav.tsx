import {
  CubeIcon,
  GridViewIcon,
  Home01Icon,
  Table01Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { useLinkStatus } from "next/link";
import { Icon } from "@/components/Icon";

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
];

// has to render inside the <Link>, that's where useLinkStatus reads the
// pending navigation from. the dev server compiling a page can take seconds
export function NavLinkIcon({
  icon,
  className,
}: {
  icon: IconSvgElement;
  className: string;
}) {
  const { pending } = useLinkStatus();
  return <Icon {...{ icon, className }} isLoading={pending} />;
}

export function AppIcon() {
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sidebar-foreground text-sidebar corner-squircle">
      <Icon icon={CubeIcon} className="size-4" />
    </span>
  );
}
