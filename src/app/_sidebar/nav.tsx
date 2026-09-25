import {
  CubeIcon,
  GridViewIcon,
  Table01Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/Icon";

// the one place a fork renames the app and edits the sidebar links
export const APP_INFO = {
  name: "nextjs-template",
  description: "starter kit",
};

export const NAV_ITEMS = [
  { href: "/", label: "Showcase", icon: GridViewIcon },
  { href: "/table", label: "Table", icon: Table01Icon },
];

export function AppIcon() {
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sidebar-foreground text-sidebar corner-squircle">
      <Icon icon={CubeIcon} className="size-4" />
    </span>
  );
}
