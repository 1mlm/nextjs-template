"use client";

import {
  Add01Icon,
  ArrowLeft01Icon,
  Delete02Icon,
  MoreHorizontalIcon,
  PinIcon,
  Search01Icon,
  Share08Icon,
} from "@hugeicons/core-free-icons";
import { motion, useMotionValueEvent, useSpring } from "motion/react";
import {
  type PointerEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
  type WheelEvent,
} from "react";
import { Icon } from "@/components/Icon";
import { Slider } from "@/shadcn/ui/slider";
import { clamp } from "@/utils/math";
import { useResizeObserver } from "@/utils/useResizeObserver";
import { GlassBlob } from "./GlassBlob";
import { type GlassSettings, groupMeltingRects } from "./glassMaps";
import { Backdrop, Stage, TOOLBAR_ICONS } from "./Stage";

const DRAG_THRESHOLD_PX = 4;
const PRESSED_SCALE = 1.12;
const MENU_SPREAD_PX = 60;

const DEFAULT_SETTINGS: GlassSettings = {
  thickness: 14,
  bezel: 16,
  frost: 0.4,
  cornerExponent: 4,
  mergeDistance: 24,
};

const SETTING_CONTROLS: {
  key: keyof GlassSettings;
  label: string;
  min: number;
  max: number;
  step: number;
}[] = [
  { key: "thickness", label: "Strength", min: 2, max: 40, step: 1 },
  { key: "bezel", label: "Rim width", min: 4, max: 30, step: 1 },
  { key: "frost", label: "Frost", min: 0, max: 4, step: 0.1 },
  {
    key: "cornerExponent",
    label: "Corners (2 circle, 4 squircle)",
    min: 2,
    max: 8,
    step: 0.1,
  },
  { key: "mergeDistance", label: "Melt distance", min: 0, max: 60, step: 1 },
];

const iconContent = (icon: Parameters<typeof Icon>[0]["icon"]) => (
  <Icon {...{ icon }} className="text-xl" />
);

// the icon you tapped gets a soft pill behind it that slides to the next
// one you tap, like the selection in an ios tab bar
function Toolbar({ selectedTool }: { selectedTool: string }) {
  return (
    <div className="flex size-full items-center justify-around px-2">
      {Object.entries(TOOLBAR_ICONS).map(([name, icon]) => (
        <span
          key={name}
          data-tap={name}
          className="relative flex size-11 items-center justify-center text-xl"
        >
          {name === selectedTool && (
            <motion.span
              layoutId="selected-tool"
              transition={{ type: "spring", bounce: 0.25, duration: 0.45 }}
              className="absolute inset-0 rounded-full bg-black/10"
            />
          )}
          <Icon {...{ icon }} className="relative" />
        </span>
      ))}
    </div>
  );
}

// every piece of glass on the stage. x is where its center starts as a share
// of the stage width (so it fits a phone too), y is px from the top
const ITEMS: {
  id: string;
  width: number;
  height: number;
  start: { x: number; y: number };
  content: (selectedTool: string) => ReactNode;
}[] = [
  {
    id: "back",
    width: 48,
    height: 48,
    start: { x: 0.1, y: 96 },
    content: () => iconContent(ArrowLeft01Icon),
  },
  {
    id: "toolbar",
    width: 300,
    height: 56,
    start: { x: 0.5, y: 20 },
    content: (selectedTool) => <Toolbar {...{ selectedTool }} />,
  },
  {
    id: "share",
    width: 48,
    height: 48,
    start: { x: 0.68, y: 96 },
    content: () => iconContent(Share08Icon),
  },
  {
    id: "more",
    width: 48,
    height: 48,
    start: { x: 0.9, y: 96 },
    content: () => iconContent(MoreHorizontalIcon),
  },
  {
    id: "new",
    width: 140,
    height: 48,
    start: { x: 0.22, y: 480 },
    content: () => (
      <span className="flex items-center gap-2 font-medium">
        <Icon icon={Add01Icon} className="text-lg" />
        New note
      </span>
    ),
  },
  {
    id: "search",
    width: 230,
    height: 48,
    start: { x: 0.62, y: 480 },
    content: () => (
      <label className="flex w-full items-center gap-2 px-4">
        <Icon icon={Search01Icon} className="text-lg opacity-60" />
        <input
          placeholder="Search notes"
          className="w-full bg-transparent text-base outline-none placeholder:text-neutral-500"
        />
      </label>
    ),
  },
];

// tapping "more" springs these out of it, so they melt out of one blob and
// back into it, the apple menu-splitting look
const MENU_ITEMS = [
  { id: "pin", icon: PinIcon },
  { id: "trash", icon: Delete02Icon },
];

type Position = { x: number; y: number };

const getStartPositions = (stageWidth: number) =>
  Object.fromEntries(
    ITEMS.map(({ id, width, start }) => [
      id,
      {
        x: clamp(start.x * stageWidth - width / 2, 8, stageWidth - width - 8),
        y: start.y,
      },
    ]),
  );

type Scale = { x: number; y: number };

const scaleRectAroundCenter = (
  { x, y }: Position,
  width: number,
  height: number,
  scale: Scale,
) => ({
  x: x + (width * (1 - scale.x)) / 2,
  y: y + (height * (1 - scale.y)) / 2,
  width: width * scale.x,
  height: height * scale.y,
  radius: Math.min(width * scale.x, height * scale.y) / 2,
});

const MAX_STRETCH = 0.3;
const STRETCH_PER_PX = 0.02;

// grabbed glass gets a bit bigger and smears along the way it's moving, like
// a blob of liquid being pulled. what it gains along the movement it loses
// across it, so the volume stays about the same
const getGrabbedScale = (
  pressScale: number,
  stretch: number,
  direction: Position,
): Scale => ({
  x: pressScale * (1 + stretch * (direction.x - 0.5 * direction.y)),
  y: pressScale * (1 + stretch * (direction.y - 0.5 * direction.x)),
});

// a number that springs to wherever `target` points, re-rendering on every
// frame so the glass maps follow the motion
function useSpringValue(target: number, bounce: number) {
  const spring = useSpring(target, { bounce, visualDuration: 0.35 });
  const [value, setValue] = useState(target);
  useMotionValueEvent(spring, "change", setValue);
  // useSpring only follows a plain number on mount, after that it has to be told
  useEffect(() => spring.set(target), [spring, target]);
  return value;
}

export default function PhysicsGlass() {
  const stageRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [draggedPositions, setDraggedPositions] = useState<Record<
    string,
    Position
  > | null>(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [pressedId, setPressedId] = useState<string | null>(null);
  const [lastPressedId, setLastPressedId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pressScale = useSpringValue(pressedId ? PRESSED_SCALE : 1, 0.3);
  const [stretchTarget, setStretchTarget] = useState(0);
  const [stretchDirection, setStretchDirection] = useState({ x: 1, y: 0 });
  const stretch = useSpringValue(stretchTarget, 0.35);
  const [selectedTool, setSelectedTool] = useState("text");
  const menuProgress = useSpringValue(isMenuOpen ? 1 : 0, 0.35);
  const dragRef = useRef<{
    id: string;
    pointerStart: Position;
    lastPointer: Position;
    element: HTMLElement;
    origin: Position;
    isDragging: boolean;
    tapTarget?: string;
  } | null>(null);

  useResizeObserver([stageRef], () => {
    if (!stageRef.current) return;
    setStageSize({
      width: stageRef.current.clientWidth,
      height: stageRef.current.clientHeight,
    });
  });

  const positions =
    draggedPositions ??
    (stageSize.width ? getStartPositions(stageSize.width) : null);

  const getScaleOf = (id: string): Scale =>
    id === lastPressedId
      ? getGrabbedScale(pressScale, stretch, stretchDirection)
      : { x: 1, y: 1 };

  const itemRects = positions
    ? ITEMS.map(({ id, width, height }) => ({
        id,
        ...scaleRectAroundCenter(positions[id], width, height, getScaleOf(id)),
      }))
    : [];
  const morePosition = positions?.more;
  const menuRects =
    morePosition && menuProgress > 0.01
      ? MENU_ITEMS.map(({ id, icon }, index) => ({
          id,
          icon,
          ...scaleRectAroundCenter(
            {
              x: morePosition.x - MENU_SPREAD_PX * (index + 1) * menuProgress,
              y: morePosition.y,
            },
            48,
            48,
            {
              x: 0.6 + 0.4 * Math.min(menuProgress, 1),
              y: 0.6 + 0.4 * Math.min(menuProgress, 1),
            },
          ),
        }))
      : [];
  const glassGroups = groupMeltingRects(
    [...itemRects, ...menuRects],
    settings.mergeDistance,
  );

  const startPress = (event: PointerEvent, id: string) => {
    if (!positions) return;
    // the pill is capturing every press so a quick flick can't outrun it, the
    // one exception is an input that's already focused, where a click has to
    // reach it to move the caret. a plain tap focuses the input in endPress
    const isEditingInput =
      event.target instanceof HTMLInputElement &&
      event.target === document.activeElement;
    if (!isEditingInput) event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      id,
      pointerStart: { x: event.clientX, y: event.clientY },
      lastPointer: { x: event.clientX, y: event.clientY },
      element: event.currentTarget as HTMLElement,
      origin: positions[id],
      isDragging: false,
      tapTarget: (event.target as HTMLElement).closest<HTMLElement>(
        "[data-tap]",
      )?.dataset.tap,
    };
    setPressedId(id);
    setLastPressedId(id);
  };

  const moveDrag = (event: PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || !positions) return;
    const deltaX = event.clientX - drag.pointerStart.x;
    const deltaY = event.clientY - drag.pointerStart.y;
    if (!drag.isDragging && Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD_PX)
      return;
    if (!drag.isDragging) {
      drag.element.setPointerCapture(event.pointerId);
      if (document.activeElement instanceof HTMLInputElement)
        document.activeElement.blur();
    }
    drag.isDragging = true;
    const moveX = event.clientX - drag.lastPointer.x;
    const moveY = event.clientY - drag.lastPointer.y;
    const moveLength = Math.hypot(moveX, moveY);
    drag.lastPointer = { x: event.clientX, y: event.clientY };
    if (moveLength > 0) {
      setStretchDirection({
        x: Math.abs(moveX) / moveLength,
        y: Math.abs(moveY) / moveLength,
      });
      setStretchTarget(Math.min(MAX_STRETCH, moveLength * STRETCH_PER_PX));
    }
    const item = ITEMS.find(({ id }) => id === drag.id);
    if (!item) return;
    setDraggedPositions({
      ...positions,
      [drag.id]: {
        x: clamp(drag.origin.x + deltaX, 0, stageSize.width - item.width),
        y: clamp(drag.origin.y + deltaY, 0, stageSize.height - item.height),
      },
    });
  };

  const endPress = () => {
    const drag = dragRef.current;
    const wasTap = drag && !drag.isDragging;
    if (wasTap && drag.id === "more") setIsMenuOpen((isOpen) => !isOpen);
    if (wasTap && drag.id === "search")
      drag.element.querySelector("input")?.focus();
    if (wasTap && drag.id === "toolbar" && drag.tapTarget)
      setSelectedTool(drag.tapTarget);
    dragRef.current = null;
    setPressedId(null);
    setStretchTarget(0);
  };

  // the glass sits above the scroller, so a wheel over it would otherwise go
  // nowhere
  const forwardWheel = (event: WheelEvent) =>
    scrollerRef.current?.scrollBy({ top: event.deltaY });

  return (
    <div className="flex flex-col gap-6">
      <Stage ref={stageRef}>
        <Backdrop ref={scrollerRef} />
        {glassGroups.map((group) => (
          <GlassBlob
            key={group.map(({ id }) => id).join()}
            rects={group}
            {...{ settings }}
          />
        ))}
        {menuRects.map(({ id, icon, x, y, width, height }) => (
          <button
            key={id}
            type="button"
            onClick={() => setIsMenuOpen(false)}
            onWheel={forwardWheel}
            className="absolute flex items-center justify-center text-neutral-900"
            style={{ left: x, top: y, width, height }}
          >
            {iconContent(icon)}
          </button>
        ))}
        {positions &&
          ITEMS.map(({ id, width, height, content }) => (
            <div
              key={id}
              onPointerDown={(event) => startPress(event, id)}
              onPointerMove={moveDrag}
              onPointerUp={endPress}
              onPointerCancel={endPress}
              onWheel={forwardWheel}
              className="absolute flex cursor-grab touch-none items-center justify-center text-neutral-900 active:cursor-grabbing"
              style={{
                left: positions[id].x,
                top: positions[id].y,
                width,
                height,
                scale: `${getScaleOf(id).x} ${getScaleOf(id).y}`,
              }}
            >
              {content(selectedTool)}
            </div>
          ))}
      </Stage>
      <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        {SETTING_CONTROLS.map(({ key, label, min, max, step }) => (
          <div key={key} className="flex flex-col gap-2 text-sm">
            <span className="flex justify-between text-muted-foreground">
              {label}
              <span className="font-mono text-foreground">{settings[key]}</span>
            </span>
            <Slider
              value={[settings[key]]}
              onValueChange={([value]) =>
                setSettings((current) => ({ ...current, [key]: value }))
              }
              {...{ min, max, step }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
