"use client";

import { motion } from "motion/react";
import { type KeyboardEvent, type PointerEvent, useRef, useState } from "react";
import { cn } from "@/shadcn/utils";
import { type Color, getColorSwatch } from "@/utils/color";
import { triggerHaptic } from "@/utils/haptics";
import { clamp } from "@/utils/math";

export type PlanePoint = {
  x: number;
  y: number;
  label?: string;
  color?: Color;
};

const DOT_SPRING = { type: "spring", stiffness: 520, damping: 30 } as const;

const ARROW_KEYS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, 1],
  ArrowDown: [0, -1],
};

const formatPoint = ({ x, y }: PlanePoint) => `(${x}, ${y})`;

const getFill = ({ color }: PlanePoint) =>
  color ? getColorSwatch(color) : "var(--primary)";

// the dashed lines run from the point straight down to the x axis and across to the y axis
const getGuideEnds = ({ x, y }: PlanePoint) => [
  { id: "to-x-axis", x, y: 0 },
  { id: "to-y-axis", x: 0, y: -y },
];

// drawn inside the svg, the handle below is what you actually grab
function PlaneGuides({ point }: { point: PlanePoint }) {
  return getGuideEnds(point).map((end) => (
    <motion.line
      key={end.id}
      initial={false}
      animate={{ x1: point.x, y1: -point.y, x2: end.x, y2: end.y }}
      transition={DOT_SPRING}
      stroke={getFill(point)}
      strokeWidth={0.06}
      strokeDasharray="0.2 0.2"
      strokeLinecap="round"
    />
  ));
}

// the dot is a plain html element over the svg on purpose: touch-action only
// works on html elements, not on things inside an svg, and without it a finger
// drag on the dot scrolls the page instead of moving the point
function PlaneHandle({
  point,
  extent,
  isDragging,
  isActive,
  onPointerDown,
  onPointerMove,
  onPointerEnd,
  onKeyDown,
  onFocusChange,
}: {
  point: PlanePoint;
  extent: number;
  isDragging: boolean;
  isActive: boolean;
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerEnd: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  onFocusChange: (isFocused: boolean) => void;
}) {
  const left = ((point.x + extent) / (extent * 2)) * 100;
  const top = ((extent - point.y) / (extent * 2)) * 100;

  return (
    <motion.div
      initial={false}
      animate={{
        left: `${left}%`,
        top: `${top}%`,
        scale: isDragging ? 1.2 : 1,
      }}
      whileHover={{ scale: 1.12 }}
      transition={DOT_SPRING}
      tabIndex={0}
      role="slider"
      aria-label={`Point ${point.label ?? ""} at ${formatPoint(point)}`}
      aria-valuetext={formatPoint(point)}
      aria-valuenow={point.x}
      style={{ touchAction: "none" }}
      className="group absolute flex size-11 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center outline-none active:cursor-grabbing"
      {...{ onPointerDown, onPointerMove, onKeyDown }}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onFocus={() => onFocusChange(true)}
      onBlur={() => onFocusChange(false)}
    >
      <span
        style={{ background: getFill(point) }}
        className="size-4 rounded-full border-2 border-background shadow group-focus-visible:ring-4 group-focus-visible:ring-ring/50"
      />
      {isActive && (
        <span className="pointer-events-none absolute -top-5 rounded-lg bg-background/85 px-1.5 text-xs font-semibold whitespace-nowrap">
          {point.label ? `${point.label} ` : ""}
          {formatPoint(point)}
        </span>
      )}
    </motion.div>
  );
}

// a ghost cell asking for a point. turns green and pops once one sits on it
function PlaneTarget({
  target,
  isReached,
}: {
  target: PlanePoint;
  isReached: boolean;
}) {
  return (
    <motion.rect
      initial={{ fillOpacity: 0 }}
      x={target.x - 0.5}
      y={-target.y - 0.5}
      width={1}
      height={1}
      rx={0.32}
      strokeWidth={0.08}
      strokeDasharray={isReached ? undefined : "0.18 0.18"}
      animate={{
        scale: isReached ? [1, 1.25, 1] : 1,
        fillOpacity: isReached ? 0.25 : 0,
      }}
      style={{ transformBox: "fill-box", transformOrigin: "center" }}
      className={cn(
        "transition-colors",
        isReached
          ? "fill-green-500 stroke-green-500"
          : "fill-foreground stroke-muted-foreground",
      )}
    />
  );
}

// a graph you can put points on. points snap to whole numbers with a spring,
// drag them or focus one and use the arrow keys. `points` is controlled, pass
// `targets` for ghost cells to hit (the parent decides what "correct" means)
export function CoordinatePlane({
  points,
  onChange,
  targets = [],
  range = 5,
  className,
}: {
  points: PlanePoint[];
  onChange: (points: PlanePoint[]) => void;
  targets?: PlanePoint[];
  range?: number;
  className?: string;
}) {
  const planeRef = useRef<HTMLDivElement>(null);
  const [draggedIndex, setDraggedIndex] = useState<number>();
  const [focusedIndex, setFocusedIndex] = useState<number>();
  // where the pointer really is, before it snaps, shown as a faint ghost dot
  const [rawPosition, setRawPosition] = useState<PlanePoint>();
  const extent = range + 1;
  const ticks = Array.from(
    { length: range * 2 + 1 },
    (_, index) => index - range,
  );
  const gridPath = ticks
    .map(
      (tick) =>
        `M${tick} ${-range - 0.5}V${range + 0.5}M${-range - 0.5} ${tick}H${range + 0.5}`,
    )
    .join("");
  const isPointOnTarget = (target: PlanePoint) =>
    points.some((point) => point.x === target.x && point.y === target.y);

  // client pixels to plane units, y flipped since the screen grows downward
  const getPlanePosition = (event: PointerEvent) => {
    const box = planeRef.current?.getBoundingClientRect();
    if (!box) return { x: 0, y: 0 };
    return {
      x: ((event.clientX - box.left) / box.width) * extent * 2 - extent,
      y: -(((event.clientY - box.top) / box.height) * extent * 2 - extent),
    };
  };

  const movePoint = (index: number, x: number, y: number) => {
    const point = points[index];
    const snapped = {
      ...point,
      x: clamp(x, -range, range),
      y: clamp(y, -range, range),
    };
    if (snapped.x === point.x && snapped.y === point.y) return;
    triggerHaptic("selection");
    onChange(points.map((existing, at) => (at === index ? snapped : existing)));
  };

  const endDrag = () => {
    setDraggedIndex(undefined);
    setRawPosition(undefined);
  };

  return (
    <div
      ref={planeRef}
      className={cn(
        "relative w-full max-w-sm overflow-hidden rounded-3xl border bg-card",
        className,
      )}
    >
      <svg
        viewBox={`${-extent} ${-extent} ${extent * 2} ${extent * 2}`}
        className="aspect-square w-full select-none"
      >
        <title>Coordinate plane</title>
        <path
          d={gridPath}
          className="stroke-border"
          strokeWidth={0.04}
          fill="none"
        />
        <path
          d={`M${-range - 0.6} 0H${range + 0.6}M0 ${-range - 0.6}V${range + 0.6}`}
          className="stroke-foreground/70"
          strokeWidth={0.09}
          strokeLinecap="round"
          fill="none"
        />
        <path
          d={`M${range + 0.3} -0.3L${range + 0.6} 0L${range + 0.3} 0.3M-0.3 ${-range - 0.3}L0 ${-range - 0.6}L0.3 ${-range - 0.3}`}
          className="stroke-foreground/70"
          strokeWidth={0.09}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {ticks.map((tick) => (
          <g key={tick} className="fill-muted-foreground text-[0.42px]">
            {tick !== 0 && (
              <>
                <text x={tick} y={0.62} textAnchor="middle">
                  {tick}
                </text>
                <text x={-0.22} y={-tick + 0.14} textAnchor="end">
                  {tick}
                </text>
              </>
            )}
          </g>
        ))}
        {targets.map((target) => (
          <PlaneTarget
            key={formatPoint(target)}
            {...{ target }}
            isReached={isPointOnTarget(target)}
          />
        ))}
        {points.map((point, index) =>
          draggedIndex === index || focusedIndex === index ? (
            <PlaneGuides key={point.label ?? index} {...{ point }} />
          ) : null,
        )}
        {rawPosition && draggedIndex !== undefined && (
          <circle
            cx={clamp(rawPosition.x, -extent, extent)}
            cy={-clamp(rawPosition.y, -extent, extent)}
            r={0.28}
            fill={getFill(points[draggedIndex])}
            opacity={0.3}
          />
        )}
      </svg>
      {points.map((point, index) => (
        <PlaneHandle
          key={point.label ?? index}
          {...{ point, extent }}
          isDragging={draggedIndex === index}
          isActive={draggedIndex === index || focusedIndex === index}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            triggerHaptic("light");
            setDraggedIndex(index);
            setRawPosition(getPlanePosition(event));
          }}
          onPointerMove={(event) => {
            if (draggedIndex !== index) return;
            const raw = getPlanePosition(event);
            setRawPosition(raw);
            movePoint(index, Math.round(raw.x), Math.round(raw.y));
          }}
          onPointerEnd={endDrag}
          onKeyDown={(event) => {
            const step = ARROW_KEYS[event.key];
            if (!step) return;
            event.preventDefault();
            movePoint(index, point.x + step[0], point.y + step[1]);
          }}
          onFocusChange={(isFocused) =>
            setFocusedIndex(isFocused ? index : undefined)
          }
        />
      ))}
    </div>
  );
}
