"use client";

import {
  Add01Icon,
  InformationCircleIcon,
  PaintBoardIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { useState } from "react";
import { DialogIconBadge } from "@/components/DialogIconBadge";
import { ErrorTooltip } from "@/components/ErrorTooltip";
import { FieldLabel } from "@/components/FieldLabel";
import { FormDialog } from "@/components/form/FormDialog";
import { useFormDialogAction } from "@/components/form/useFormDialogAction";
import { Icon } from "@/components/Icon";
import { RelativeTime } from "@/components/RelativeTime";
import { ResponsivePopover } from "@/components/ResponsivePopover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/Tooltip";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shadcn/ui/dialog";
import { Input } from "@/shadcn/ui/input";
import { getColorStyle, TAG_COLORS } from "@/utils/color";
import type { ShowcaseItem } from "./ShowcaseCard";
import { useIsClient, wait } from "./util";

const PICKER_COLORS = TAG_COLORS.slice(0, 12);

function ResponsivePopoverDemo() {
  const [picked, setPicked] = useState(PICKER_COLORS[0]);

  return (
    <ResponsivePopover
      title="Pick a color"
      trigger={
        <Button variant="outline">
          <Icon icon={PaintBoardIcon} />
          Color: {picked}
        </Button>
      }
    >
      <div className="grid grid-cols-6 gap-2">
        {PICKER_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={color}
            onClick={() => setPicked(color)}
            style={getColorStyle(color)}
            className="aspect-square rounded-lg corner-squircle ring-offset-2 ring-offset-popover data-[picked=true]:ring-2 data-[picked=true]:ring-foreground"
            data-picked={color === picked}
          />
        ))}
      </div>
    </ResponsivePopover>
  );
}

async function createProject(formData: FormData) {
  await wait(900);
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Give it a name first" };
  if (name.toLowerCase() === "oops")
    return { error: "The server said no (try any other name)" };
  return { error: null };
}

function FormDialogDemo() {
  const { open, setOpen, error, formAction, pending } =
    useFormDialogAction(createProject);

  return (
    <FormDialog
      onOpenChange={setOpen}
      trigger={
        <Button>
          <Icon icon={Add01Icon} />
          New project
        </Button>
      }
      title="New project"
      description="Create a new project"
      submitIcon={Add01Icon}
      submitLabel="Create"
      {...{ open, formAction, pending, error }}
    >
      <div className="flex flex-col gap-2">
        <FieldLabel htmlFor="project-name" required>
          Name
        </FieldLabel>
        <Input
          id="project-name"
          name="name"
          placeholder='type "oops" to fail'
        />
      </div>
    </FormDialog>
  );
}

function RelativeTimeDemo() {
  const isClient = useIsClient();
  if (!isClient) return null;
  return (
    <span className="text-sm">
      edited <RelativeTime date={new Date(Date.now() - 35 * 60_000)} />
    </span>
  );
}

export const OVERLAY_ITEMS: ShowcaseItem[] = [
  {
    name: "ResponsivePopover",
    path: "src/components/ResponsivePopover.tsx",
    description:
      "popover on desktop, bottom sheet on phones. shrink the window and open it again",
    Demo: ResponsivePopoverDemo,
  },
  {
    name: "FormDialog + useFormDialogAction",
    path: "src/components/form/",
    description:
      "dialog form shell, spinner while pending, error buzzes + chimes, success closes with a chime. fields survive a failed submit",
    Demo: FormDialogDemo,
  },
  {
    name: "Tooltip",
    path: "src/components/Tooltip.tsx",
    description: "radix tooltip that also opens on tap on touch devices",
    Demo: () => (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon">
            <Icon icon={InformationCircleIcon} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>hi, tap works too on phones</TooltipContent>
      </Tooltip>
    ),
  },
  {
    name: "DialogIconBadge",
    path: "src/components/DialogIconBadge.tsx",
    description: "tilted squircle icon pinned to a dialog's corner",
    Demo: () => (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Open dialog</Button>
        </DialogTrigger>
        <DialogContent className="overflow-visible pt-10">
          <DialogIconBadge icon={SparklesIcon} />
          <DialogHeader>
            <DialogTitle>Fancy dialog</DialogTitle>
            <DialogDescription>
              the badge pokes out of the top-left corner
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    ),
  },
  {
    name: "ErrorTooltip",
    path: "src/components/ErrorTooltip.tsx",
    description: "tiny inline error marker next to whatever failed, hover it",
    Demo: () => (
      <span className="inline-flex items-center gap-2 text-sm">
        Sync failed
        <ErrorTooltip message="Couldn't reach the server, retrying in 30s" />
      </span>
    ),
  },
  {
    name: "RelativeTime",
    path: "src/components/RelativeTime.tsx",
    description: "relative date, hover for the exact one",
    Demo: RelativeTimeDemo,
  },
];
