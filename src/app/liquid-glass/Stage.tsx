"use client";

import {
  Attachment01Icon,
  Camera01Icon,
  CheckListIcon,
  PenTool01Icon,
  TableIcon,
  TextFontIcon,
} from "@hugeicons/core-free-icons";
import { motion } from "motion/react";
import {
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
  useRef,
} from "react";
import { Icon } from "@/components/Icon";
import { cn } from "@/shadcn/utils";

// the library variants all get the exact same pill in the exact same spot, so
// the only thing that differs between those tabs is the glass itself
export const GLASS_SIZE = { width: 320, height: 60 };
export const GLASS_START = { left: "calc(50% - 160px)", top: 136 };

export const TOOLBAR_ICONS = {
  text: TextFontIcon,
  checklist: CheckListIcon,
  table: TableIcon,
  attach: Attachment01Icon,
  camera: Camera01Icon,
  draw: PenTool01Icon,
};

const GROCERIES = [
  { item: "Oat milk", isDone: true },
  { item: "Blood oranges", isDone: false },
  { item: "Sourdough", isDone: true },
  { item: "Pistachio butter", isDone: false },
];

const PHOTOS = [
  {
    label: "Sunset pier",
    background:
      "radial-gradient(circle at 70% 30%,#ffd6a5 0 12%,transparent 13%),linear-gradient(180deg,#ff9a76,#ffb88c 45%,#5b6ee1 46%,#2e3a87)",
  },
  {
    label: "Lake house",
    background:
      "radial-gradient(ellipse at 30% 80%,#2f9e6e 0 30%,transparent 31%),linear-gradient(180deg,#a8e0ff,#d9f2ff 55%,#3fa7d6 56%,#1d6fa3)",
  },
  {
    label: "Market",
    background:
      "radial-gradient(circle at 25% 35%,#ff5d73 0 14%,transparent 15%),radial-gradient(circle at 60% 60%,#ffc145 0 16%,transparent 17%),radial-gradient(circle at 80% 30%,#7bd389 0 12%,transparent 13%),#fff3e0",
  },
];

const TRIP_TILES = [
  { label: "Lisbon", color: "#ffb4a2" },
  { label: "Kyoto", color: "#cdb4db" },
  { label: "Oaxaca", color: "#ffd166" },
  { label: "Bergen", color: "#a2d2ff" },
  { label: "Tbilisi", color: "#b5e48c" },
  { label: "Hoi An", color: "#f4acb7" },
];

const PARAGRAPHS = [
  "Saturday morning farmers market, then the long walk along the river if the weather holds. Call Sam about the lake house, book the table for eight, and pick up the film photos before the shop closes at six.",
  "Sunday is for nothing. Maybe the bakery on the corner, maybe the museum with the glass roof, maybe neither. The point is to scroll under the glass and watch every line of text bend at the rim and slide back straight in the middle.",
  "Packing list for the lake: two sweaters, the good camera, the paperback that has been on the nightstand since spring, a thermos, and the speaker that only sort of works.",
];

export function ToolbarIcons() {
  return (
    <div className="relative flex size-full items-center justify-around px-3 text-xl text-neutral-900">
      {Object.entries(TOOLBAR_ICONS).map(([name, icon]) => (
        <Icon key={name} {...{ icon }} />
      ))}
    </div>
  );
}

// a fake notes page, scrollable, with sharp text, soft photos and color
// blocks, the stuff refraction visibly bends. all css so the webgl snapshots
// can grab it too
export function Backdrop({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "absolute inset-0 overflow-y-auto bg-[#fbf8f3] text-neutral-900",
        className,
      )}
      {...props}
    >
      <div className="flex flex-col gap-6 px-6 pt-28 pb-40 sm:px-12">
        <div className="h-56 shrink-0 rounded-3xl bg-[radial-gradient(circle_at_20%_30%,#ffcfb3,transparent_45%),radial-gradient(circle_at_80%_20%,#c8b6ff,transparent_50%),radial-gradient(circle_at_60%_90%,#9be7ff,transparent_55%),#fff1e6]" />
        <div className="flex flex-col gap-1">
          <h2 className="text-5xl font-black tracking-tight sm:text-6xl">
            Weekend plans
          </h2>
          <span className="text-sm text-neutral-500">
            Saturday, October 18 · 9:41
          </span>
        </div>
        <p className="max-w-2xl text-lg leading-8">{PARAGRAPHS[0]}</p>
        <div className="flex flex-wrap gap-4">
          {PHOTOS.map(({ label, background }) => (
            <figure key={label} className="flex flex-col gap-1.5">
              <div
                className="h-36 w-52 rounded-2xl shadow-sm"
                style={{ background }}
              />
              <figcaption className="text-sm text-neutral-500">
                {label}
              </figcaption>
            </figure>
          ))}
        </div>
        <ul className="flex flex-col gap-2 text-lg">
          {GROCERIES.map(({ item, isDone }) => (
            <li key={item} className="flex items-center gap-2">
              <span
                className={cn(
                  "size-4 rounded-full border-2 border-[#ff9500]",
                  isDone && "bg-[#ff9500]",
                )}
              />
              <span className={cn(isDone && "line-through opacity-50")}>
                {item}
              </span>
            </li>
          ))}
        </ul>
        <p className="max-w-2xl text-lg leading-8">{PARAGRAPHS[1]}</p>
        <h3 className="text-3xl font-bold tracking-tight">Trip ideas</h3>
        <div className="grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
          {TRIP_TILES.map(({ label, color }) => (
            <div
              key={label}
              className="flex h-24 items-end rounded-2xl p-3 text-lg font-semibold"
              style={{ background: color }}
            >
              {label}
            </div>
          ))}
        </div>
        <div className="h-28 max-w-2xl shrink-0 rounded-2xl bg-[repeating-linear-gradient(115deg,#ffd6e0_0_14px,#fff_14px_28px,#d6e4ff_28px_42px,#fff_42px_56px)]" />
        <p className="max-w-2xl text-lg leading-8">{PARAGRAPHS[2]}</p>
        <p className="max-w-2xl text-lg leading-8">{PARAGRAPHS[0]}</p>
      </div>
    </div>
  );
}

export function Stage({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "relative h-[560px] w-full overflow-hidden rounded-3xl ring-1 ring-border select-none",
        className,
      )}
      {...props}
    />
  );
}

// the pill for library variants that don't bring their own dragging. grows a
// touch while held, like apple's controls do under a finger
export function DraggableGlass({
  className,
  style,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  return (
    <Stage ref={stageRef}>
      <Backdrop />
      <motion.div
        drag
        dragConstraints={stageRef}
        dragMomentum={false}
        whileDrag={{ scale: 1.06 }}
        className={cn(
          "absolute cursor-grab touch-none active:cursor-grabbing",
          className,
        )}
        style={{ ...GLASS_SIZE, ...GLASS_START, ...style }}
      >
        {children}
        <ToolbarIcons />
      </motion.div>
    </Stage>
  );
}
