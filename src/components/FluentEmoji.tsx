"use client";

import { type CSSProperties, useState } from "react";
import { cn } from "@/shadcn/utils";

// microsoft's 3D fluent emoji, straight from their github through jsdelivr
// (static png, ~40kb) and the community animated set (apng, ~800kb so it
// only loads on hover or when asked). adding one = adding a row: the name
// exactly as on https://github.com/microsoft/fluentui-emoji/tree/main/assets
// (any casing) and its folder in
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

// "Red Heart" -> assets/Red heart/3D/red_heart_3d.png, the hands live one
// folder deeper under their default (yellow) skin tone
function getStaticEmojiUrl({ name, hasSkinTones }: FluentEmojiEntry) {
  const folder = name.charAt(0) + name.slice(1).toLowerCase();
  const fileName = name.toLowerCase().replaceAll(" ", "_");
  const path = hasSkinTones
    ? `${folder}/Default/3D/${fileName}_3d_default.png`
    : `${folder}/3D/${fileName}_3d.png`;
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

// `tint` recolors it while keeping all the 3D shading: a color or gradient
// laid on top with mix-blend-color, masked to the emoji's own silhouette.
// "var(--color-green-500)" or "linear-gradient(135deg, #f0f, #0ff)" both work
export function FluentEmoji({
  emoji,
  animation = EmojiAnimation.Hover,
  tint,
  className,
}: {
  emoji: FluentEmojiId;
  animation?: EmojiAnimation;
  tint?: string;
  className?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimationLoaded, setIsAnimationLoaded] = useState(false);
  const entry = FLUENT_EMOJIS[emoji];
  const staticSrc = getStaticEmojiUrl(entry);
  const isAnimated =
    animation === EmojiAnimation.Always ||
    (animation === EmojiAnimation.Hover && isHovered);
  const animatedSrc = getAnimatedEmojiUrl(entry);
  // the tint follows whichever one is showing so it moves with the animation
  const visibleSrc = isAnimated && isAnimationLoaded ? animatedSrc : staticSrc;
  const tintStyle: CSSProperties = {
    background: tint,
    maskImage: `url("${visibleSrc}")`,
    maskSize: "contain",
  };

  return (
    <span
      className={cn(
        "relative isolate inline-block size-12 shrink-0",
        className,
      )}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
    >
      {/* biome-ignore lint/performance/noImgElement: remote cdn file, next/image would need remotePatterns and re-encoding kills the apng animation */}
      <img
        src={staticSrc}
        alt={entry.name}
        draggable={false}
        className="size-full object-contain select-none"
      />
      {/* the animated one loads on top and only shows once it's all there,
      so the first hover doesn't blink to an empty box for a second */}
      {isAnimated && (
        // biome-ignore lint/performance/noImgElement: same as above
        <img
          src={animatedSrc}
          alt=""
          draggable={false}
          onLoad={() => setIsAnimationLoaded(true)}
          className={cn(
            "absolute inset-0 size-full object-contain select-none",
            !isAnimationLoaded && "opacity-0",
          )}
        />
      )}
      {tint && (
        <span
          aria-hidden
          style={tintStyle}
          className="absolute inset-0 mix-blend-color"
        />
      )}
    </span>
  );
}
