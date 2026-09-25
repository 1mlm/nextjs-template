import type { IconSvgElement } from "@hugeicons/react";
import type { ComponentProps } from "react";
import { Icon } from "@/components/Icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/Tooltip";
import { Button } from "@/shadcn/ui/button";
import { cn } from "@/shadcn/utils";
import type { Color } from "@/utils/color";
import { getColorStyle } from "@/utils/color";

export enum MiniButtonTone {
  Neutral = "neutral",
  View = "view",
  Edit = "edit",
  Confirm = "confirm",
  Destructive = "destructive",
}

const TONE_COLOR: Partial<Record<MiniButtonTone, Color>> = {
  [MiniButtonTone.View]: "sky",
  [MiniButtonTone.Edit]: "amber",
  [MiniButtonTone.Confirm]: "green",
};

// palette tones go through getColorStyle (light-dark(), not a dark: class)
// so they match every other tinted pill in the app. destructive isn't a
// palette color, it's the --destructive token, so it just uses Button's own
// destructive variant instead
const getToneStyle = (tone: MiniButtonTone) => {
  const color = TONE_COLOR[tone];
  return color ? getColorStyle(color) : undefined;
};

// small icon-only button used for repeated row actions (table rows, note
// rows, etc), a `tone` picks the semantic color instead of every call site
// hand-rolling its own tint
export function MiniButton({
  icon,
  label,
  tone = MiniButtonTone.Neutral,
  className,
  ...buttonProps
}: {
  icon: IconSvgElement;
  label: string;
  tone?: MiniButtonTone;
} & Omit<ComponentProps<typeof Button>, "variant" | "size" | "children">) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={
            tone === MiniButtonTone.Destructive ? "destructive" : "ghost"
          }
          size="icon-sm"
          style={getToneStyle(tone)}
          className={cn(
            "border border-border/60",
            TONE_COLOR[tone] && "hover:opacity-80",
            className,
          )}
          {...buttonProps}
        >
          <Icon {...{ icon }} />
          <span className="sr-only">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
