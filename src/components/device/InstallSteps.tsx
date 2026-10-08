import { AddSquareIcon, Share03Icon } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { Icon } from "@/components/Icon";
import { cn } from "@/shadcn/utils";
import type { ManualInstallPlatform } from "./useInstallPrompt";

type InstallStep = {
  // drawn like the button safari shows, so it's easy to spot on screen
  button: { label: string; icon?: IconSvgElement; isConfirm?: boolean };
  hint: string;
};

// the share sheet half is the same on every ios browser
const IOS_SHARE_SHEET_STEPS: InstallStep[] = [
  {
    button: { label: "Add to Home Screen", icon: AddSquareIcon },
    hint: "scroll down the list a bit",
  },
  {
    button: { label: "Add", isConfirm: true },
    hint: "top right, and it's installed",
  },
];

// ios 26 tucked Share behind the ••• menu, older ones show it straight in
// the toolbar, so the iphone steps cover both
export const INSTALL_STEPS: Record<ManualInstallPlatform, InstallStep[]> = {
  iphone: [
    { button: { label: "•••" }, hint: "next to the address, bottom of Safari" },
    {
      button: { label: "Share", icon: Share03Icon },
      hint: "already in the toolbar on older iPhones",
    },
    ...IOS_SHARE_SHEET_STEPS,
  ],
  ipad: [
    {
      button: { label: "Share", icon: Share03Icon },
      hint: "top right of Safari",
    },
    ...IOS_SHARE_SHEET_STEPS,
  ],
  iosBrowser: [
    {
      button: { label: "Share", icon: Share03Icon },
      hint: "in the address bar or the browser menu",
    },
    ...IOS_SHARE_SHEET_STEPS,
  ],
  mac: [
    { button: { label: "File" }, hint: "in the menu bar" },
    {
      button: { label: "Add to Dock", icon: AddSquareIcon },
      hint: "bottom of the menu",
    },
    { button: { label: "Add", isConfirm: true }, hint: "and it's installed" },
  ],
};

// safari never offers an install prompt, so these walk people through doing
// it by hand, one mini safari button per step
export function InstallSteps({
  platform,
}: {
  platform: ManualInstallPlatform;
}) {
  const steps = INSTALL_STEPS[platform];

  return (
    <ol className="flex flex-col gap-2.5">
      {steps.map(({ button, hint }, index) => (
        <li key={button.label} className="flex items-center gap-2.5">
          <span className="grid size-5 shrink-0 place-items-center rounded-full bg-blue-500 text-[11px] font-semibold text-white">
            {index + 1}
          </span>
          <span className="flex min-w-0 flex-col items-start gap-1">
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-lg bg-background px-2.5 py-1 text-sm font-medium shadow-sm ring-1 ring-border",
                button.isConfirm && "font-semibold text-blue-500",
              )}
            >
              {button.icon && (
                <Icon icon={button.icon} className="size-4 text-blue-500" />
              )}
              {button.label}
            </span>
            <span className="text-xs text-muted-foreground">{hint}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
