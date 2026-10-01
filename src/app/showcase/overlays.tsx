"use client";

import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  DeliveryTruck01Icon,
  InformationSquareIcon,
  Invoice01Icon,
  Money03Icon,
  PackageIcon,
  PaintBoardIcon,
  Rocket01Icon,
  StarIcon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons";
import { useState } from "react";
import { DialogIconBadge } from "@/components/DialogIconBadge";
import { ErrorTooltip } from "@/components/ErrorTooltip";
import { FieldLabel } from "@/components/FieldLabel";
import { FormDialog } from "@/components/form/FormDialog";
import { useFormDialogAction } from "@/components/form/useFormDialogAction";
import { Icon } from "@/components/Icon";
import { LazyDialog } from "@/components/LazyDialog";
import { RelativeTime } from "@/components/RelativeTime";
import { ResponsivePopover } from "@/components/ResponsivePopover";
import { Stepper, type StepperStep } from "@/components/Stepper";
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
import { triggerConfetti } from "@/utils/confetti";
import { APP_ICONS } from "@/utils/icons";
import type { ShowcaseItem } from "./ShowcaseCard";
import { wait } from "./util";

const PICKER_COLORS = TAG_COLORS.slice(0, 12);

function ResponsivePopoverDemo() {
  const [picked, setPicked] = useState(PICKER_COLORS[0]);
  const [open, setOpen] = useState(false);

  return (
    <ResponsivePopover
      {...{ open }}
      onOpenChange={setOpen}
      title="Pick a color"
      icon={PaintBoardIcon}
      trigger={
        <Button variant="outline">
          <span
            style={getColorStyle(picked)}
            className="size-4 rounded-sm ring-2 ring-current"
          />
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
            onClick={() => {
              setPicked(color);
              setOpen(false);
            }}
            style={getColorStyle(color)}
            className="grid aspect-square place-items-center rounded-lg ring-offset-2 ring-offset-popover transition-[scale,box-shadow] duration-150 hover:scale-105 data-[picked=true]:scale-110 data-[picked=true]:shadow-[0_0_14px_2px_currentColor] data-[picked=true]:ring-2 data-[picked=true]:ring-current"
            data-picked={color === picked}
          >
            {color === picked && (
              <Icon icon={APP_ICONS.confirm} className="size-5" />
            )}
          </button>
        ))}
      </div>
    </ResponsivePopover>
  );
}

const PROJECT_STEPS: (StepperStep & { hint: string })[] = [
  {
    id: "details",
    label: "Details",
    icon: APP_ICONS.edit,
    hint: "name it, describe it",
  },
  {
    id: "team",
    label: "Team",
    icon: UserAdd01Icon,
    hint: "invite the people you like",
  },
  {
    id: "settings",
    label: "Settings",
    icon: APP_ICONS.settings,
    hint: "privacy, labels, all that",
  },
  {
    id: "launch",
    label: "Launch",
    icon: Rocket01Icon,
    hint: "one click and it's live",
  },
];

function StepperDemo() {
  const [stepIndex, setStepIndex] = useState(0);
  const isLastStep = stepIndex === PROJECT_STEPS.length - 1;
  const isFinished = stepIndex === PROJECT_STEPS.length;
  const currentStep = PROJECT_STEPS[stepIndex];

  const goNext = () => {
    if (isLastStep) triggerConfetti();
    setStepIndex(stepIndex + 1);
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <Stepper
        steps={PROJECT_STEPS}
        currentIndex={stepIndex}
        onStepClick={setStepIndex}
      />
      <div className="flex items-center gap-3 rounded-xl bg-muted p-3">
        <Icon
          icon={currentStep?.icon ?? Rocket01Icon}
          className="size-5 text-muted-foreground"
        />
        <p className="text-sm">
          {currentStep?.hint ?? "shipped! click a step to go back to it"}
        </p>
      </div>
      <div className="flex justify-between gap-2">
        <Button
          variant="outline"
          disabled={stepIndex === 0}
          onClick={() => setStepIndex(stepIndex - 1)}
        >
          <Icon icon={ArrowLeft01Icon} />
          Back
        </Button>
        {isFinished ? (
          <Button variant="outline" onClick={() => setStepIndex(0)}>
            <Icon icon={APP_ICONS.reload} />
            Start over
          </Button>
        ) : (
          <Button onClick={goNext}>
            {isLastStep ? "Launch" : "Next"}
            <Icon icon={isLastStep ? Rocket01Icon : ArrowRight01Icon} />
          </Button>
        )}
      </div>
    </div>
  );
}

// pretend api, the first open fails so the retry path shows up too
const loadAttempts = { count: 0 };
async function loadOrder() {
  await wait(1200);
  loadAttempts.count += 1;
  if (loadAttempts.count === 1)
    throw new Error("showcase LazyDialog demo: first load fails on purpose");
  return [
    { icon: PackageIcon, label: "Items", value: "3 mugs, 1 teapot" },
    { icon: Money03Icon, label: "Total", value: "420 MAD" },
    {
      icon: DeliveryTruck01Icon,
      label: "Shipping",
      value: "Casablanca, 2 days",
    },
    { icon: APP_ICONS.calendar, label: "Ordered", value: "Sep 24, 2026" },
  ];
}

function LazyDialogDemo() {
  return (
    <LazyDialog
      title="Order #1042"
      icon={Invoice01Icon}
      load={loadOrder}
      trigger={
        <Button variant="outline">
          <Icon icon={Invoice01Icon} />
          View order
        </Button>
      }
    >
      {(rows) => (
        <dl className="flex flex-col gap-1">
          {rows.map(({ icon, label, value }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-lg px-2 py-2 odd:bg-muted/50"
            >
              <Icon {...{ icon }} className="size-4 text-muted-foreground" />
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="ml-auto font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </LazyDialog>
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
  const { open, setOpen, error, failedCount, formAction, pending } =
    useFormDialogAction(createProject);

  return (
    <FormDialog
      onOpenChange={setOpen}
      trigger={
        <Button>
          <Icon icon={APP_ICONS.add} />
          New project
        </Button>
      }
      title="New project"
      description="Create a new project"
      submitIcon={APP_ICONS.add}
      submitLabel="Create"
      {...{ open, formAction, pending, error, failedCount }}
    >
      <div className="flex flex-col gap-2">
        <FieldLabel htmlFor="project-name" required>
          Name
        </FieldLabel>
        <Input
          id="project-name"
          name="name"
          required
          placeholder='type "oops" to fail'
        />
      </div>
    </FormDialog>
  );
}

function RelativeTimeDemo() {
  // 50s ago so "Just now" visibly flips to "1 minute ago" after a few seconds
  const [editedAt] = useState(() => new Date(Date.now() - 50_000));
  return (
    <span className="text-sm">
      last edit: <RelativeTime date={editedAt} />
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
    name: "Stepper",
    path: "src/components/Stepper.tsx",
    description:
      "icon chain on wide screens, segmented bar on phones. done steps are clickable, future ones aren't",
    wide: true,
    Demo: StepperDemo,
  },
  {
    name: "LazyDialog",
    path: "src/components/LazyDialog.tsx",
    description:
      "fetches on first hover/open and keeps it. the first try fails on purpose so you see the retry",
    Demo: LazyDialogDemo,
  },
  {
    name: "FormDialog + useFormDialogAction",
    path: "src/components/form/",
    description:
      "dialog form shell, spinner while pending. submit empty or type oops: the button and error shake, buzz + chime. success closes with a chime, fields survive a failed submit",
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
            <Icon icon={InformationSquareIcon} />
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
        <DialogContent className="md:overflow-visible md:pt-10">
          <DialogIconBadge icon={StarIcon} />
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
    description:
      "live relative date, hover for the clock: exact date, elapsed time ticking by the second, timestamp. same one table date cells use",
    Demo: RelativeTimeDemo,
  },
];
