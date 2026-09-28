"use client";

import { useEffect, useState } from "react";
import { cn } from "@/shadcn/utils";
import { type Color, recolorSvg } from "@/utils/color";

// microsoft's fluent emoji, straight from their github through jsdelivr: the
// 3D png (~40kb), the community animated apng (~800kb so it only loads on
// hover or when asked) and the flat "Color" svg, which is what a theme
// recolors. adding one = adding a row: the name exactly as on
// https://github.com/microsoft/fluentui-emoji/tree/main/assets (any casing)
// and its folder in
// https://github.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/tree/master/Emojis
type FluentEmojiEntry = {
  name: string;
  category: string;
  hasSkinTones?: boolean;
  // a "tool" whose colored parts can move to any tailwind color and still
  // look drawn that way. faces, food, hands and plants look wrong recolored
  themeable?: boolean;
};

export const FLUENT_EMOJIS = {
  compass: { name: "Compass", category: "Travel and places", themeable: true },
  calendar: { name: "Tear-Off Calendar", category: "Objects", themeable: true },
  spiralCalendar: {
    name: "Spiral Calendar",
    category: "Objects",
    themeable: true,
  },
  pushpin: { name: "Pushpin", category: "Objects", themeable: true },
  roundPushpin: { name: "Round Pushpin", category: "Objects", themeable: true },
  bell: { name: "Bell", category: "Objects", themeable: true },
  lightBulb: { name: "Light Bulb", category: "Objects", themeable: true },
  key: { name: "Key", category: "Objects", themeable: true },
  locked: { name: "Locked", category: "Objects", themeable: true },
  magnifyingGlass: {
    name: "Magnifying Glass Tilted Left",
    category: "Objects",
    themeable: true,
  },
  rocket: { name: "Rocket", category: "Travel and places", themeable: true },
  trophy: { name: "Trophy", category: "Activities", themeable: true },
  shield: { name: "Shield", category: "Objects", themeable: true },
  clipboard: { name: "Clipboard", category: "Objects", themeable: true },
  bookmark: { name: "Bookmark", category: "Objects", themeable: true },
  megaphone: { name: "Megaphone", category: "Objects", themeable: true },
  folder: { name: "File Folder", category: "Objects", themeable: true },
  hourglass: {
    name: "Hourglass Done",
    category: "Travel and places",
    themeable: true,
  },
  alarmClock: {
    name: "Alarm Clock",
    category: "Travel and places",
    themeable: true,
  },
  magnet: { name: "Magnet", category: "Objects", themeable: true },
  crown: { name: "Crown", category: "Objects", themeable: true },
  glowingStar: {
    name: "Glowing Star",
    category: "Travel and places",
    themeable: true,
  },
  barChart: { name: "Bar Chart", category: "Objects", themeable: true },
  chartIncreasing: {
    name: "Chart Increasing",
    category: "Objects",
    themeable: true,
  },
  toolbox: { name: "Toolbox", category: "Objects", themeable: true },
  creditCard: { name: "Credit Card", category: "Objects", themeable: true },
  books: { name: "Books", category: "Objects", themeable: true },
  bullseye: { name: "Bullseye", category: "Activities", themeable: true },
  pen: { name: "Pen", category: "Objects", themeable: true },
  memo: { name: "Memo", category: "Objects", themeable: true },
  worldMap: {
    name: "World Map",
    category: "Travel and places",
    themeable: true,
  },
  tickets: {
    name: "Admission Tickets",
    category: "Activities",
    themeable: true,
  },
  graduationCap: {
    name: "Graduation Cap",
    category: "Objects",
    themeable: true,
  },
  sun: { name: "Sun", category: "Travel and places", themeable: true },
  moonCrescent: {
    name: "Crescent Moon",
    category: "Travel and places",
    themeable: true,
  },
  moonFull: {
    name: "Full Moon",
    category: "Travel and places",
    themeable: true,
  },
  moonNew: {
    name: "New Moon",
    category: "Travel and places",
    themeable: true,
  },
  gloves: { name: "Gloves", category: "Objects", themeable: true },
  briefcase: { name: "Briefcase", category: "Objects", themeable: true },
  umbrella: {
    name: "Umbrella",
    category: "Travel and places",
    themeable: true,
  },
  ring: { name: "Ring", category: "Objects", themeable: true },
  wrench: { name: "Wrench", category: "Objects", themeable: true },
  gear: { name: "Gear", category: "Objects", themeable: true },
  anchor: { name: "Anchor", category: "Travel and places", themeable: true },
  ladder: { name: "Ladder", category: "Objects", themeable: true },
  scissors: { name: "Scissors", category: "Objects", themeable: true },
  envelope: { name: "Envelope", category: "Objects", themeable: true },
  package: { name: "Package", category: "Objects", themeable: true },
  paperclip: { name: "Paperclip", category: "Objects", themeable: true },
  speechBalloon: {
    name: "Speech Balloon",
    category: "Smilies",
    themeable: true,
  },
  testTube: { name: "Test Tube", category: "Objects", themeable: true },
  atomSymbol: { name: "Atom Symbol", category: "Symbols", themeable: true },
  dna: { name: "DNA", category: "Objects", themeable: true },
  satellite: {
    name: "Satellite",
    category: "Travel and places",
    themeable: true,
  },
  telescope: { name: "Telescope", category: "Objects", themeable: true },
  highVoltage: {
    name: "High Voltage",
    category: "Travel and places",
    themeable: true,
  },
  puzzlePiece: {
    name: "Puzzle Piece",
    category: "Activities",
    themeable: true,
  },
  chessPawn: { name: "Chess Pawn", category: "Activities", themeable: true },
  artistPalette: {
    name: "Artist Palette",
    category: "Activities",
    themeable: true,
  },
  fire: { name: "Fire", category: "Travel and places" },
  heart: { name: "Red Heart", category: "Smilies" },
  party: { name: "Party Popper", category: "Activities" },
  starStruck: { name: "Star-Struck", category: "Smilies" },
  cool: { name: "Smiling Face with Sunglasses", category: "Smilies" },
  rainbow: { name: "Rainbow", category: "Travel and places" },
  hundred: { name: "Hundred Points", category: "Smilies" },
  ghost: { name: "Ghost", category: "Smilies" },
  robot: { name: "Robot", category: "Smilies" },
  unicorn: { name: "Unicorn", category: "Animals" },
  cat: { name: "Cat Face", category: "Animals" },
  seedling: { name: "Seedling", category: "Animals" },
  coffee: { name: "Hot Beverage", category: "Food" },
  pizza: { name: "Pizza", category: "Food" },
  brain: { name: "Brain", category: "Hand gestures" },
  wave: { name: "Waving Hand", category: "Hand gestures", hasSkinTones: true },
  thumbsUp: {
    name: "Thumbs Up",
    category: "Hand gestures",
    hasSkinTones: true,
  },
  pray: { name: "Folded Hands", category: "Hand gestures", hasSkinTones: true },
  laptop: { name: "Laptop", category: "Objects" },
  moneyBag: { name: "Money Bag", category: "Objects" },
  check: { name: "Check Mark Button", category: "Symbols" },
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

// "Red Heart" + 3D -> assets/Red heart/3D/red_heart_3d.png, the hands live
// one folder deeper under their default (yellow) skin tone
function getMicrosoftEmojiUrl(
  { name, hasSkinTones }: FluentEmojiEntry,
  style: "3D" | "Color",
) {
  const folder = name.charAt(0) + name.slice(1).toLowerCase();
  const fileName = `${name.toLowerCase().replaceAll(" ", "_")}_${style.toLowerCase()}`;
  const extension = style === "3D" ? "png" : "svg";
  const path = hasSkinTones
    ? `${folder}/Default/${style}/${fileName}_default.${extension}`
    : `${folder}/${style}/${fileName}.${extension}`;
  return encodeURI(
    `https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/${path}`,
  );
}

const getAnimatedEmojiUrl = ({ name, category }: FluentEmojiEntry) =>
  encodeURI(
    `https://cdn.jsdelivr.net/gh/Tarikul-Islam-Anik/Animated-Fluent-Emojis@master/Emojis/${category}/${name}.png`,
  );

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

// the flat svg with its colored parts moved onto the theme's tailwind ramp
// (see recolorSvg), greys and whites untouched. drawn through an <img> so
// nothing in a fetched file can ever run
function ThemedEmoji({
  entry,
  theme,
}: {
  entry: FluentEmojiEntry;
  theme: Color;
}) {
  const [svg, setSvg] = useState<string>();
  const url = getMicrosoftEmojiUrl(entry, "Color");
  useEffect(() => {
    fetchSvg(url)
      .then(setSvg)
      .catch(() => setSvg(undefined));
  }, [url]);
  if (!svg) return null;
  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(recolorSvg(svg, theme))}`;

  return (
    // biome-ignore lint/performance/noImgElement: a data uri svg, nothing for next/image to optimize
    <img
      {...{ src }}
      alt={entry.name}
      draggable={false}
      className={IMAGE_CLASS}
    />
  );
}

// `theme="green"` swaps a tool emoji's 3D look for the flat one recolored
// green, like it was drawn for your brand. themed ones don't animate, there's
// no animated svg to recolor
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
  const [isAnimationLoaded, setIsAnimationLoaded] = useState(false);
  const entry = FLUENT_EMOJIS[emoji];
  const isAnimated =
    !theme &&
    (animation === EmojiAnimation.Always ||
      (animation === EmojiAnimation.Hover && isHovered));

  return (
    <span
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
      {theme ? (
        <ThemedEmoji {...{ entry, theme }} />
      ) : (
        // biome-ignore lint/performance/noImgElement: remote cdn file, next/image would need remotePatterns and re-encoding kills the apng animation
        <img
          src={getMicrosoftEmojiUrl(entry, "3D")}
          alt={entry.name}
          draggable={false}
          className={IMAGE_CLASS}
        />
      )}
      {/* the animated one loads on top and only shows once it's all there,
      so the first hover doesn't blink to an empty box for a second */}
      {isAnimated && (
        // biome-ignore lint/performance/noImgElement: same as above
        <img
          src={getAnimatedEmojiUrl(entry)}
          alt=""
          draggable={false}
          onLoad={() => setIsAnimationLoaded(true)}
          className={cn(
            IMAGE_CLASS,
            "absolute inset-0",
            !isAnimationLoaded && "opacity-0",
          )}
        />
      )}
    </span>
  );
}
