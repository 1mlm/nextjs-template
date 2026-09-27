"use client";

import {
  Compass01Icon,
  Location01Icon,
  MinusSignIcon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import {
  Bricolage_Grotesque,
  Caveat,
  Fraunces,
  Geist,
  Inter,
  JetBrains_Mono,
  Outfit,
  Space_Grotesk,
} from "next/font/google";
import { useState } from "react";
import {
  EmojiAnimation,
  FLUENT_EMOJIS,
  FluentEmoji,
  type FluentEmojiId,
} from "@/components/FluentEmoji";
import { Icon } from "@/components/Icon";
import { ScrollRow } from "@/components/ScrollRow";
import { SquircleFuserContainer } from "@/components/SquircleFuser";
import { cn } from "@/shadcn/utils";
import { useCopyToClipboard } from "@/utils/clipboard";
import { type Color, getColorSwatch } from "@/utils/color";
import { triggerHaptic } from "@/utils/haptics";
import type { ShowcaseItem } from "./ShowcaseCard";

// preload off: only this page uses them, no other route should download 8
// fonts. next wants each loader call in its own module level const
const outfit = Outfit({ preload: false });
const inter = Inter({ preload: false });
const geist = Geist({ preload: false });
const spaceGrotesk = Space_Grotesk({ preload: false });
const bricolageGrotesque = Bricolage_Grotesque({ preload: false });
const fraunces = Fraunces({ preload: false });
const caveat = Caveat({ preload: false });
const jetBrainsMono = JetBrains_Mono({ preload: false });

const FONTS = [
  { name: "Outfit", importName: "Outfit", font: outfit },
  { name: "Inter", importName: "Inter", font: inter },
  { name: "Geist", importName: "Geist", font: geist },
  { name: "Space Grotesk", importName: "Space_Grotesk", font: spaceGrotesk },
  {
    name: "Bricolage Grotesque",
    importName: "Bricolage_Grotesque",
    font: bricolageGrotesque,
  },
  { name: "Fraunces", importName: "Fraunces", font: fraunces },
  { name: "Caveat", importName: "Caveat", font: caveat },
  { name: "JetBrains Mono", importName: "JetBrains_Mono", font: jetBrainsMono },
];

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
                "shrink-0 rounded-lg px-2.5 py-1 text-sm whitespace-nowrap",
                name === pickedName
                  ? "bg-foreground text-background"
                  : "bg-muted hover:bg-muted-foreground/20",
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

const THEMES: { label: string; theme?: Color[] }[] = [
  { label: "3D" },
  { label: "Green", theme: ["green"] },
  { label: "Sunset", theme: ["orange", "fuchsia"] },
  { label: "Ocean", theme: ["indigo", "cyan"] },
  { label: "Candy", theme: ["violet", "pink", "yellow"] },
];

const EMOJI_IDS = Object.keys(FLUENT_EMOJIS) as FluentEmojiId[];

function FluentEmojiDemo() {
  const [themeLabel, setThemeLabel] = useState(THEMES[0]?.label);
  const { theme } = THEMES.find(({ label }) => label === themeLabel) ?? {};

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        {THEMES.map(({ label, theme: optionTheme }) => (
          <button
            key={label}
            type="button"
            onClick={() => setThemeLabel(label)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm",
              label === themeLabel
                ? "bg-foreground text-background"
                : "bg-muted hover:bg-muted-foreground/20",
            )}
          >
            <span className="flex -space-x-1">
              {optionTheme?.map((color) => (
                <span
                  key={color}
                  style={{ background: getColorSwatch(color) }}
                  className="size-3 rounded-full"
                />
              ))}
            </span>
            {label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {EMOJI_IDS.map((emoji) => (
          <FluentEmoji
            key={emoji}
            {...{ emoji, theme }}
            className="size-full transition-transform hover:scale-125"
          />
        ))}
      </div>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <FluentEmoji
          emoji="party"
          animation={EmojiAnimation.Always}
          className="size-10"
        />
        hover any of them to play it, or animation="always"
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
    <div
      style={{ backgroundImage: FAKE_MAP_BACKGROUND }}
      className="relative h-56 w-full overflow-hidden rounded-3xl bg-lime-800"
    >
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
      "microsoft's 3D emoji by name, animated on hover. a theme recolors every color inside the flat version with your tailwind colors, shading kept",
    Demo: FluentEmojiDemo,
  },
  {
    name: "Fonts",
    path: "src/app/showcase/look.tsx",
    description:
      "a few google fonts worth trying, tap one to preview it, tap the import to copy it",
    Demo: FontsDemo,
  },
];
