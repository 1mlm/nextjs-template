"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/shadcn/utils";
import { type Color, recolorSvg } from "@/utils/color";

// microsoft's fluent emoji as their flat "Color" svgs, straight from their
// github through jsdelivr. svg only on purpose: a 3D png is ~40kb each and a
// page of them ate the network, an svg is a few kb and can be recolored.
// adding one = adding a row: the name exactly as on
// https://github.com/microsoft/fluentui-emoji/tree/main/assets (any casing),
// and check it has a Color folder there, no svg means it doesn't go in
type FluentEmojiEntry = {
  name: string;
  hasSkinTones?: boolean;
  // a "tool" whose colored parts can move to any tailwind color and still
  // look drawn that way. faces, food, hands and plants look wrong recolored
  themeable?: boolean;
};

export const FLUENT_EMOJIS = {
  compass: { name: "Compass", themeable: true },
  calendar: { name: "Tear-Off Calendar", themeable: true },
  spiralCalendar: { name: "Spiral Calendar", themeable: true },
  pushpin: { name: "Pushpin", themeable: true },
  roundPushpin: { name: "Round Pushpin", themeable: true },
  bell: { name: "Bell", themeable: true },
  lightBulb: { name: "Light Bulb", themeable: true },
  key: { name: "Key", themeable: true },
  locked: { name: "Locked", themeable: true },
  magnifyingGlass: { name: "Magnifying Glass Tilted Left", themeable: true },
  rocket: { name: "Rocket", themeable: true },
  trophy: { name: "Trophy", themeable: true },
  shield: { name: "Shield", themeable: true },
  clipboard: { name: "Clipboard", themeable: true },
  bookmark: { name: "Bookmark", themeable: true },
  megaphone: { name: "Megaphone", themeable: true },
  folder: { name: "File Folder", themeable: true },
  hourglass: { name: "Hourglass Done", themeable: true },
  alarmClock: { name: "Alarm Clock", themeable: true },
  magnet: { name: "Magnet", themeable: true },
  crown: { name: "Crown", themeable: true },
  glowingStar: { name: "Glowing Star", themeable: true },
  barChart: { name: "Bar Chart", themeable: true },
  chartIncreasing: { name: "Chart Increasing", themeable: true },
  toolbox: { name: "Toolbox", themeable: true },
  creditCard: { name: "Credit Card", themeable: true },
  books: { name: "Books", themeable: true },
  bullseye: { name: "Bullseye", themeable: true },
  pen: { name: "Pen", themeable: true },
  memo: { name: "Memo", themeable: true },
  worldMap: { name: "World Map", themeable: true },
  tickets: { name: "Admission Tickets", themeable: true },
  graduationCap: { name: "Graduation Cap", themeable: true },
  sun: { name: "Sun", themeable: true },
  moonCrescent: { name: "Crescent Moon", themeable: true },
  moonFull: { name: "Full Moon", themeable: true },
  moonNew: { name: "New Moon", themeable: true },
  gloves: { name: "Gloves", themeable: true },
  briefcase: { name: "Briefcase", themeable: true },
  umbrella: { name: "Umbrella", themeable: true },
  ring: { name: "Ring", themeable: true },
  wrench: { name: "Wrench", themeable: true },
  gear: { name: "Gear", themeable: true },
  anchor: { name: "Anchor", themeable: true },
  ladder: { name: "Ladder", themeable: true },
  scissors: { name: "Scissors", themeable: true },
  envelope: { name: "Envelope", themeable: true },
  package: { name: "Package", themeable: true },
  paperclip: { name: "Paperclip", themeable: true },
  speechBalloon: { name: "Speech Balloon", themeable: true },
  testTube: { name: "Test Tube", themeable: true },
  atomSymbol: { name: "Atom Symbol", themeable: true },
  dna: { name: "DNA", themeable: true },
  satellite: { name: "Satellite", themeable: true },
  telescope: { name: "Telescope", themeable: true },
  highVoltage: { name: "High Voltage", themeable: true },
  puzzlePiece: { name: "Puzzle Piece", themeable: true },
  chessPawn: { name: "Chess Pawn", themeable: true },
  artistPalette: { name: "Artist Palette", themeable: true },
  fire: { name: "Fire" },
  heart: { name: "Red Heart" },
  party: { name: "Party Popper" },
  starStruck: { name: "Star-Struck" },
  cool: { name: "Smiling Face with Sunglasses" },
  rainbow: { name: "Rainbow" },
  hundred: { name: "Hundred Points" },
  ghost: { name: "Ghost" },
  robot: { name: "Robot" },
  unicorn: { name: "Unicorn" },
  cat: { name: "Cat Face" },
  seedling: { name: "Seedling" },
  coffee: { name: "Hot Beverage" },
  pizza: { name: "Pizza" },
  brain: { name: "Brain" },
  wave: { name: "Waving Hand", hasSkinTones: true },
  thumbsUp: { name: "Thumbs Up", hasSkinTones: true },
  pray: { name: "Folded Hands", hasSkinTones: true },
  laptop: { name: "Laptop" },
  moneyBag: { name: "Money Bag" },
  check: { name: "Check Mark Button" },
} satisfies Record<string, FluentEmojiEntry>;

export type FluentEmojiId = keyof typeof FLUENT_EMOJIS;

// only the tools take a theme, the type stops `<FluentEmoji emoji="pizza" theme=...>`
export type ThemeableEmojiId = {
  [Id in FluentEmojiId]: (typeof FLUENT_EMOJIS)[Id] extends { themeable: true }
    ? Id
    : never;
}[FluentEmojiId];

export const isThemeableEmoji = (id: FluentEmojiId): id is ThemeableEmojiId =>
  "themeable" in FLUENT_EMOJIS[id];

// "Red Heart" -> assets/Red heart/Color/red_heart_color.svg, the hands live
// one folder deeper under their default (yellow) skin tone
function getEmojiSvgUrl({ name, hasSkinTones }: FluentEmojiEntry) {
  const folder = name.charAt(0) + name.slice(1).toLowerCase();
  const fileName = `${name.toLowerCase().replaceAll(" ", "_")}_color`;
  const path = hasSkinTones
    ? `${folder}/Default/Color/${fileName}_default.svg`
    : `${folder}/Color/${fileName}.svg`;
  return encodeURI(
    `https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/${path}`,
  );
}

export enum EmojiAnimation {
  Never = "never",
  Hover = "hover",
  Always = "always",
}

// each svg downloads once however many emoji on the page use it
const svgRequests = new Map<string, Promise<string>>();
function fetchSvg(url: string) {
  const cached = svgRequests.get(url);
  if (cached) return cached;
  const request = fetch(url).then((response) => {
    if (!response.ok) throw new Error(`emoji svg ${response.status}`);
    return response.text();
  });
  // a failed download is forgotten so the next render tries again
  request.catch(() => svgRequests.delete(url));
  svgRequests.set(url, request);
  return request;
}

const IMAGE_CLASS = "size-full object-contain select-none";

// the svg with its colored parts moved onto the theme's tailwind ramp (see
// recolorSvg), greys and whites untouched, or as drawn when there's no theme.
// drawn through an <img> so nothing in a fetched file can ever run
function SvgEmoji({
  entry,
  theme,
  className,
}: {
  entry: FluentEmojiEntry;
  theme?: Color;
  className?: string;
}) {
  const [svg, setSvg] = useState<string>();
  const url = getEmojiSvgUrl(entry);
  useEffect(() => {
    fetchSvg(url)
      .then(setSvg)
      .catch(() => setSvg(undefined));
  }, [url]);
  if (!svg) return null;
  const drawnSvg = theme ? recolorSvg(svg, theme) : svg;
  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(drawnSvg)}`;

  return (
    // biome-ignore lint/performance/noImgElement: a data uri svg, nothing for next/image to optimize
    <img
      {...{ src }}
      alt={entry.name}
      draggable={false}
      className={cn(IMAGE_CLASS, className)}
    />
  );
}

// nothing downloads until the emoji is within a screen of the viewport, so a
// page (or a showcase card) full of them costs nothing until you scroll to it
function useIsNearViewport() {
  const ref = useRef<HTMLSpanElement>(null);
  const [isNear, setIsNear] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setIsNear(true);
        observer.disconnect();
      },
      { rootMargin: "300px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return { ref, isNear };
}

// `theme="green"` redraws a tool emoji in that color, like it was drawn for
// your brand. hover (or a tap) makes it dance
export function FluentEmoji({
  emoji,
  animation = EmojiAnimation.Hover,
  theme,
  className,
}: {
  animation?: EmojiAnimation;
  className?: string;
} & (
  | { emoji: FluentEmojiId; theme?: undefined }
  | { emoji: ThemeableEmojiId; theme: Color }
)) {
  const [isHovered, setIsHovered] = useState(false);
  const { ref, isNear } = useIsNearViewport();
  const isAnimated =
    animation === EmojiAnimation.Always ||
    (animation === EmojiAnimation.Hover && isHovered);

  return (
    <span
      {...{ ref }}
      className={cn("relative inline-block size-12 shrink-0", className)}
      // a finger has no hover, so on touch a tap toggles it instead
      onPointerEnter={(event) =>
        event.pointerType === "mouse" && setIsHovered(true)
      }
      onPointerLeave={(event) =>
        event.pointerType === "mouse" && setIsHovered(false)
      }
      onPointerUp={(event) =>
        event.pointerType !== "mouse" && setIsHovered((wasOn) => !wasOn)
      }
    >
      {isNear && (
        <SvgEmoji
          entry={FLUENT_EMOJIS[emoji]}
          {...{ theme }}
          className={cn(isAnimated && "origin-bottom animate-emoji-dance")}
        />
      )}
    </span>
  );
}
