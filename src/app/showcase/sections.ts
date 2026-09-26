import { BUTTON_ITEMS } from "./buttons";
import { CHART_ITEMS } from "./charts";
import { DATA_ITEMS } from "./data";
import { FEEL_ITEMS } from "./feel";
import { INPUT_ITEMS } from "./inputs";
import { OVERLAY_ITEMS } from "./overlays";
import { STATE_ITEMS } from "./states";

export const SHOWCASE_SECTIONS = [
  { title: "Buttons", items: BUTTON_ITEMS },
  { title: "Overlays & forms", items: OVERLAY_ITEMS },
  { title: "Inputs", items: INPUT_ITEMS },
  { title: "States & display", items: STATE_ITEMS },
  { title: "Feel (haptics, sound, confetti)", items: FEEL_ITEMS },
  { title: "Charts", items: CHART_ITEMS },
  { title: "Data & pages", items: DATA_ITEMS },
];

// "NumberTextInput + FieldLabel" -> "numbertextinput-fieldlabel", the card's id
export const getShowcaseSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// scrolls a card into the middle and pulses a ring around it so your eye
// lands on it (the command palette jumps here)
export function flashShowcaseCard(slug: string) {
  const card = document.getElementById(slug);
  if (!card) return;
  card.scrollIntoView({ behavior: "smooth", block: "center" });
  card.animate(
    [
      { boxShadow: "0 0 0 0 transparent" },
      { boxShadow: "0 0 0 4px var(--ring)" },
      { boxShadow: "0 0 0 0 transparent" },
    ],
    { duration: 1400, delay: 300, easing: "ease-in-out" },
  );
}
