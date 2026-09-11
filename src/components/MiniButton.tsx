import type { ComponentProps, CSSProperties } from "react";
import { type HugeIcon, Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn/ui/tooltip";
import { cn } from "@/shadcn/utils";
import type { Color } from "@/utils/color";
import { getColorStyle } from "@/utils/color";

export type MiniButtonTone =
  | "neutral"
  | "view"
  | "edit"
  | "confirm"
  | "destructive";

const TONE_COLOR: Partial<Record<MiniButtonTone, Color>> = {
  view: "sky",
  edit: "amber",
  confirm: "green",
};

// tinted ghost styling for a small icon-only row action — reuses
// getColorStyle (light-dark(), not a dark: class) so it matches every other
// tinted badge/pill in the app. destructive isn't a Color from the tailwind
// palette, it's the semantic --destructive token, so it gets the same
// color-mix treatment the destructive dropdown-item hover fix uses in
// globals.css instead of going through getColorStyle
function getToneStyle(tone: MiniButtonTone): CSSProperties | undefined {
  if (tone === "neutral") return undefined;
  if (tone === "destructive") {
    return {
      backgroundColor:
        "color-mix(in oklab, var(--destructive) 10%, transparent)",
      color: "var(--destructive)",
    };
  }
  return getColorStyle(TONE_COLOR[tone]);
}

// small icon-only button used for repeated row actions (table rows, note
// rows, etc) — a `tone` picks the semantic color instead of every call site
// hand-rolling its own tint
export function MiniButton({
  icon,
  label,
  tone = "neutral",
  className,
  ...buttonProps
}: {
  icon: HugeIcon;
  label: string;
  tone?: MiniButtonTone;
} & Omit<ComponentProps<typeof Button>, "variant" | "size" | "children">) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          style={getToneStyle(tone)}
          className={cn(
            "border border-border/60",
            tone !== "neutral" && "hover:opacity-80",
            className,
          )}
          {...buttonProps}
        >
          <Icon icon={icon} />
          <span className="sr-only">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
