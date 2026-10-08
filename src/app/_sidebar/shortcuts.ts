import { NAV_ITEMS } from "./nav";

// long-press (phone) or right-click (desktop) the installed app's icon to
// jump straight to a page. every nav page except the one start_url opens
export const APP_SHORTCUTS = NAV_ITEMS.filter(
  ({ href }) => href !== "/showcase",
);
