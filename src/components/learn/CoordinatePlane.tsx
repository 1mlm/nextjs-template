"use client";

import { motion } from "motion/react";
import {
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
  useRef,
  useState,
} from "react";
import { cn } from "@/shadcn/utils";
import { type Color, getColorSwatch } from "@/utils/color";
import { triggerHaptic } from "@/utils/haptics";

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

const clamp = (value: number, limit: number) =>
  Math.min(limit, Math.max(-limit, value));

const formatPoint = ({ x, y }: PlanePoint) => `(${x}, ${y})`;

function PlaneDot({
  point,
  range,
  svgRef,
  onMove,
}: {
  point: PlanePoint;
  range: number;
  svgRef: RefObject<SVGSVGElement | null>;
  onMove: (moved: PlanePoint) => void;
}) {
  const [rawPosition, setRawPosition] = useState<PlanePoint>();
  const [isFocused, setIsFocused] = useState(false);
  const isActive = Boolean(rawPosition) || isFocused;
  const fill = point.color ? getColorSwatch(point.color) : "var(--primary)";
  const extent = range + 1;

  // client pixels to plane units, y flipped since svg grows downward
  const getPlanePosition = (event: PointerEvent) => {
    const box = svgRef.current?.getBoundingClientRect();
    if (!box) return point;
    return {
      x: ((event.clientX - box.left) / box.width) * extent * 2 - extent,
      y: -(((event.clientY - box.top) / box.height) * extent * 2 - extent),
    };
  };

  const moveTo = (x: number, y: number) => {
    const snapped = { ...point, x: clamp(x, range), y: clamp(y, range) };
    if (snapped.x === point.x && snapped.y === point.y) return;
    triggerHaptic("selection");
    onMove(snapped);
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (!rawPosition) return;
    const raw = getPlanePosition(event);
    setRawPosition(raw);
    moveTo(Math.round(raw.x), Math.round(raw.y));
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const step = ARROW_KEYS[event.key];
    if (!step) return;
    event.preventDefault();
    moveTo(point.x + step[0], point.y + step[1]);
  };

  return (
    <>
      {isActive && (
        <>
          {/* dashed guides down to the axes, the way you'd read a point off a graph */}
          <motion.line
            initial={false}
            animate={{ x1: point.x, y1: -point.y, x2: point.x, y2: 0 }}
            transition={DOT_SPRING}
            stroke={fill}
            strokeWidth={0.06}
            strokeDasharray="0.2 0.2"
            strokeLinecap="round"
          />
          <motion.line
            initial={false}
            animate={{ x1: point.x, y1: -point.y, x2: 0, y2: -point.y }}
            transition={DOT_SPRING}
            stroke={fill}
            strokeWidth={0.06}
            strokeDasharray="0.2 0.2"
            strokeLinecap="round"
          />
        </>
      )}
      {rawPosition && (
        <circle
          cx={clamp(rawPosition.x, extent)}
          cy={-clamp(rawPosition.y, extent)}
          r={0.28}
          {...{ fill }}
          opacity={0.3}
        />
      )}
      <motion.g
        initial={false}
        animate={{ x: point.x, y: -point.y, scale: rawPosition ? 1.2 : 1 }}
        whileHover={{ scale: 1.12 }}
        transition={DOT_SPRING}
        tabIndex={0}
        role="slider"
        aria-label={`Point ${point.label ?? ""} at ${formatPoint(point)}`}
        aria-valuetext={formatPoint(point)}
        aria-valuenow={point.x}
        className="cursor-grab outline-none active:cursor-grabbing"
        style={{ touchAction: "none" }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          triggerHaptic("light");
          setRawPosition(getPlanePosition(event));
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={() => setRawPosition(undefined)}
        onPointerCancel={() => setRawPosition(undefined)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      >
        {/* roomy invisible hit area, a fingertip is wider than a dot */}
        <circle r={0.75} fill="transparent" />
        {isFocused && (
          <circle
            r={0.6}
            fill="none"
            stroke={fill}
            strokeOpacity={0.5}
            strokeWidth={0.08}
          />
        )}
        <circle
          r={0.34}
          {...{ fill }}
          stroke="var(--background)"
          strokeWidth={0.1}
        />
        {isActive && (
          <text
            y={-0.75}
            textAnchor="middle"
            className="fill-foreground stroke-background text-[0.42px] font-semibold [paint-order:stroke]"
            strokeWidth={0.14}
          >
            {point.label ? `${point.label} ` : ""}
            {formatPoint(point)}
          </text>
        )}
      </motion.g>
    </>
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
  const svgRef = useRef<SVGSVGElement>(null);
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

  return (
    <div
      className={cn(
        "w-full max-w-sm overflow-hidden rounded-3xl border bg-card",
        className,
      )}
    >
      <svg
        ref={svgRef}
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
        {points.map((point, index) => (
          <PlaneDot
            key={point.label ?? index}
            {...{ point, range, svgRef }}
            onMove={(moved) =>
              onChange(
                points.map((existing, at) => (at === index ? moved : existing)),
              )
            }
          />
        ))}
      </svg>
    </div>
  );
}
