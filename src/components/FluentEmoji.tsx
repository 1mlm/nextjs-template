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
};

export const FLUENT_EMOJIS = {
  rocket: { name: "Rocket", category: "Travel and places" },
  fire: { name: "Fire", category: "Travel and places" },
  heart: { name: "Red Heart", category: "Smilies" },
  party: { name: "Party Popper", category: "Activities" },
  sparkles: { name: "Sparkles", category: "Activities" },
  starStruck: { name: "Star-Struck", category: "Smilies" },
  cool: { name: "Smiling Face with Sunglasses", category: "Smilies" },
  rainbow: { name: "Rainbow", category: "Travel and places" },
  crown: { name: "Crown", category: "Objects" },
  gem: { name: "Gem Stone", category: "Objects" },
  lightBulb: { name: "Light Bulb", category: "Objects" },
  trophy: { name: "Trophy", category: "Activities" },
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
  bell: { name: "Bell", category: "Objects" },
  check: { name: "Check Mark Button", category: "Symbols" },
} satisfies Record<string, FluentEmojiEntry>;

export type FluentEmojiId = keyof typeof FLUENT_EMOJIS;

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
  const request =
    svgRequests.get(url) ?? fetch(url).then((response) => response.text());
  svgRequests.set(url, request);
  return request;
}

const IMAGE_CLASS = "size-full object-contain select-none";

// every fill and gradient stop in the flat svg gets moved to the theme's
// hue, each one keeping its own lightness and colorfulness, so the shading
// and highlights survive. drawn through an <img> so nothing in a fetched
// file can ever run
function ThemedEmoji({
  entry,
  theme,
}: {
  entry: FluentEmojiEntry;
  theme: Color[];
}) {
  const [svg, setSvg] = useState<string>();
  const url = getMicrosoftEmojiUrl(entry, "Color");
  useEffect(() => {
    fetchSvg(url).then(setSvg);
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

// `theme` swaps the 3D look for the flat one recolored with tailwind colors:
// ["green"] is all greens, ["orange", "fuchsia"] runs the dark parts orange
// and the light parts pink. themed ones don't animate, there's no animated svg
export function FluentEmoji({
  emoji,
  animation = EmojiAnimation.Hover,
  theme,
  className,
}: {
  emoji: FluentEmojiId;
  animation?: EmojiAnimation;
  theme?: Color[];
  className?: string;
}) {
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
