"use client";

import {
  Compass01Icon,
  Location01Icon,
  MinusSignIcon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { Inter, Montserrat, Outfit, Space_Grotesk } from "next/font/google";
import { useState } from "react";
import {
  EmojiAnimation,
  FLUENT_EMOJIS,
  FluentEmoji,
  type FluentEmojiId,
  isThemeableEmoji,
} from "@/components/FluentEmoji";
import { Icon } from "@/components/Icon";
import { ScrollRow } from "@/components/ScrollRow";
import { SquircleFuserContainer } from "@/components/SquircleFuser";
import { cn } from "@/shadcn/utils";
import { useCopyToClipboard } from "@/utils/clipboard";
import { type Color, getColorSwatch } from "@/utils/color";
import { triggerHaptic } from "@/utils/haptics";
import type { ShowcaseItem } from "./ShowcaseCard";

// the ones actually worth using. preload off: only this page shows them,
// no other route should download them. next wants one module level const each
const outfit = Outfit({ preload: false });
const inter = Inter({ preload: false });
const montserrat = Montserrat({ preload: false });
const spaceGrotesk = Space_Grotesk({ preload: false });

const FONTS = [
  { name: "Outfit", importName: "Outfit", font: outfit },
  { name: "Inter", importName: "Inter", font: inter },
  { name: "Montserrat", importName: "Montserrat", font: montserrat },
  { name: "Space Grotesk", importName: "Space_Grotesk", font: spaceGrotesk },
];

// the picked one goes solid, same pill for the font and emoji theme pickers
const getTogglePillClass = (isPicked: boolean) =>
  cn(
    "rounded-lg px-2.5 py-1 text-sm transition-colors",
    isPicked
      ? "bg-foreground text-background"
      : "bg-muted hover:bg-muted-foreground/20",
  );

function FontsDemo() {
  const [pickedName, setPickedName] = useState(FONTS[0]?.name);
  const picked = FONTS.find(({ name }) => name === pickedName) ?? FONTS[0];
  const { copied, copy } = useCopyToClipboard();
  if (!picked) return null;
  const snippet = `import { ${picked.importName} } from "next/font/google";`;

  return (
    <div className="flex w-full min-w-0 flex-col gap-3">
      <ScrollRow>
        <div className="flex gap-1.5">
          {FONTS.map(({ name, font }) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                setPickedName(name);
              }}
              className={cn(
                font.className,
                "shrink-0 whitespace-nowrap",
                getTogglePillClass(name === pickedName),
              )}
            >
              {name}
            </button>
          ))}
        </div>
      </ScrollRow>
      <div
        className={cn(
          picked.font.className,
          "flex flex-col gap-1 rounded-xl bg-muted p-4",
        )}
      >
        <span className="text-4xl leading-tight font-bold">Aa Gg 0123</span>
        <span className="text-lg">
          The quick brown fox jumps over the lazy dog
        </span>
        <span className="text-sm text-muted-foreground">
          regular, <b>bold</b>, <i>italic</i> and 1,234.56 numbers
        </span>
      </div>
      <button
        type="button"
        onClick={() => copy(snippet)}
        className="cursor-copy truncate rounded-lg bg-muted px-3 py-2 text-left font-mono text-xs text-muted-foreground hover:text-foreground"
      >
        {copied ? "copied!" : snippet}
      </button>
    </div>
  );
}

// undefined = the emoji as microsoft drew it
const EMOJI_THEMES: (Color | undefined)[] = [
  undefined,
  "green",
  "violet",
  "sky",
  "rose",
  "amber",
];

const EMOJI_IDS = Object.keys(FLUENT_EMOJIS) as FluentEmojiId[];
const THEMEABLE_EMOJI_IDS = EMOJI_IDS.filter(isThemeableEmoji);

function FluentEmojiDemo() {
  const [theme, setTheme] = useState<Color>();
  const emojiClassName = "size-full transition-transform hover:scale-125";

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        {EMOJI_THEMES.map((option) => (
          <button
            key={option ?? "original"}
            type="button"
            onClick={() => setTheme(option)}
            className={cn(
              "flex items-center gap-1.5 capitalize",
              getTogglePillClass(option === theme),
            )}
          >
            {option && (
              <span
                style={{ background: getColorSwatch(option) }}
                className="size-3 rounded-full"
              />
            )}
            {option ?? "original"}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {theme
          ? THEMEABLE_EMOJI_IDS.map((emoji) => (
              <FluentEmoji
                key={emoji}
                {...{ emoji, theme }}
                className={emojiClassName}
              />
            ))
          : EMOJI_IDS.map((emoji) => (
              <FluentEmoji
                key={emoji}
                {...{ emoji }}
                className={emojiClassName}
              />
            ))}
      </div>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <FluentEmoji
          emoji="party"
          animation={EmojiAnimation.Always}
          className="size-10"
        />
        hover (or tap) any of them to make it dance, or animation="always"
      </div>
    </div>
  );
}

const MAP_CONTROLS = [
  { label: "Zoom in", icon: PlusSignIcon },
  { label: "Zoom out", icon: MinusSignIcon },
  { label: "Recenter", icon: Location01Icon },
];

const FAKE_MAP_BACKGROUND = [
  "radial-gradient(circle at 30% 40%, var(--color-emerald-400), transparent 50%)",
  "radial-gradient(circle at 75% 70%, var(--color-sky-500), transparent 45%)",
  "repeating-linear-gradient(35deg, transparent 0 22px, rgb(255 255 255 / 0.08) 22px 24px)",
].join(", ");

// the frame is the card's own color, so the pills read as the frame
// bulging inward to hold them
function SquircleFuserDemo() {
  return (
    // the pills are siblings of the clipped frame, not inside it: inside the
    // clip, the frame's half covered edge pixel bleeds green past the pill
    <div className="relative h-56 w-full">
      <div
        style={{ backgroundImage: FAKE_MAP_BACKGROUND }}
        className="absolute inset-0 overflow-hidden rounded-3xl rounded-tl-none bg-lime-800"
      />
      <SquircleFuserContainer
        align="top-left"
        background="bg-card"
        wrapperClassName="absolute top-0 left-0"
        className="gap-2 font-semibold"
      >
        <Icon icon={Compass01Icon} className="size-5" />
        Campus map
      </SquircleFuserContainer>
      <SquircleFuserContainer
        align="bottom-center"
        background="bg-card"
        wrapperClassName="absolute bottom-0 left-1/2 -translate-x-1/2"
        className="gap-1"
      >
        {MAP_CONTROLS.map(({ label, icon }) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            className="grid size-8 place-items-center rounded-full hover:bg-muted"
          >
            <Icon {...{ icon }} />
          </button>
        ))}
      </SquircleFuserContainer>
      <SquircleFuserContainer
        align="right"
        background="bg-card"
        wrapperClassName="absolute top-1/2 right-0 -translate-y-1/2"
        className="text-xs font-medium"
      >
        <span className="[writing-mode:vertical-rl]">12 pins</span>
      </SquircleFuserContainer>
    </div>
  );
}

export const LOOK_ITEMS: ShowcaseItem[] = [
  {
    name: "SquircleFuserContainer",
    path: "src/components/SquircleFuser.tsx",
    description:
      "a pill docked in the corner or on the edge of a frame, the frame melts into it with concave squircle corners",
    wide: true,
    Demo: SquircleFuserDemo,
  },
  {
    name: "FluentEmoji",
    path: "src/components/FluentEmoji.tsx",
    description:
      "microsoft's fluent emoji as svg by name, they dance on hover or tap and only download once you scroll near them. pick a color: the tool ones get redrawn in it, the colored parts move onto that tailwind ramp and the greys stay",
    Demo: FluentEmojiDemo,
  },
  {
    name: "Fonts",
    path: "src/app/showcase/look.tsx",
    description:
      "the four fonts worth using, tap one to preview it, tap the import to copy it",
    Demo: FontsDemo,
  },
];
