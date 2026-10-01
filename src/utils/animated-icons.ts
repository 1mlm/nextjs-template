import { Cursor01Icon } from "@animateicons/react/huge/cursor-0-1-icon";
import { Layers01Icon } from "@animateicons/react/huge/layers-0-1-icon";
import { Message01Icon } from "@animateicons/react/huge/message-0-1-icon";
import { TableIcon } from "@animateicons/react/huge/table-icon";
import type { APP_ICONS } from "./icons";

// the animated twin of an APP_ICONS concept, only for spots that play it on
// hover (sidebar, tab bar). keyed by the same concept names and checked
// against them, so the animated glyph can't drift from the static one.
// separate file so pages that only need APP_ICONS don't pull these chunks
export const ANIMATED_APP_ICONS = {
  showcase: Cursor01Icon,
  table: TableIcon,
  blocks: Layers01Icon,
  chat: Message01Icon,
} satisfies Partial<Record<keyof typeof APP_ICONS, unknown>>;
