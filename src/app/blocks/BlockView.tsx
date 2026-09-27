"use client";

import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { motion } from "motion/react";
import { Select as SelectPrimitive } from "radix-ui";
import {
  type CSSProperties,
  createContext,
  type PointerEvent,
  type ReactNode,
  useContext,
} from "react";
import { Icon } from "@/components/Icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/shadcn/ui/select";
import { cn } from "@/shadcn/utils";
import {
  type BlockNode,
  type BlockPart,
  CATEGORY_STYLES,
  getBlockDefinition,
  PartKind,
  VARIABLE_NAMES,
  ValueType,
} from "./blocks";
import { getBodyListKey, type ListKey } from "./tree";

export enum DropKind {
  List = "list",
  Input = "input",
  Canvas = "canvas",
  Trash = "trash",
}

export type DropTarget =
  | { kind: DropKind.List; listKey: ListKey; index: number }
  | { kind: DropKind.Input; nodeId: string; inputId: string }
  | { kind: DropKind.Canvas; x: number; y: number }
  | { kind: DropKind.Trash };

type BlockEditorContextValue = {
  startDrag: (event: PointerEvent<HTMLElement>, node: BlockNode) => void;
  setField: (nodeId: string, fieldId: string, value: string) => void;
  dropTarget: DropTarget | undefined;
  // height of what's being dragged, the gap opened for it in a stack
  dragHeight: number;
  runningId: string | undefined;
};

export const BlockEditorContext = createContext<BlockEditorContextValue | null>(
  null,
);

function useBlockEditor() {
  const editor = useContext(BlockEditorContext);
  if (!editor) throw new Error("block views need a BlockEditorContext");
  return editor;
}

// the connector: a trapezoid 16px wide at the top, 8px at the bottom, 6px
// deep. a block's top has it cut out (a real hole, the canvas shows
// through), the block above has the same shape sticking out of its bottom,
// so stacked blocks lock into each other with nothing in between
const CONNECTOR_WIDTH = 16;
const CONNECTOR_DEPTH = 6;
const CONNECTOR_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='6'%3E%3Cpath d='M0 0h16l-4 6H4z'/%3E%3C/svg%3E")`;
// the left bar of a C block (repeat, if), its insides start after it
export const SPINE_WIDTH = 16;

export enum ConnectorSpot {
  // under the block's left edge, where a block below it attaches
  Outer = 12,
  // past the spine of a C block, where the first block inside attaches
  Inner = 28,
}

const getNotchMask = (spot: ConnectorSpot): CSSProperties => ({
  maskImage: `${CONNECTOR_SVG}, linear-gradient(#000 0 0)`,
  maskPosition: `${spot}px 0, 0 0`,
  maskSize: `${CONNECTOR_WIDTH}px ${CONNECTOR_DEPTH}px, 100% 100%`,
  maskRepeat: "no-repeat",
  maskComposite: "exclude",
  WebkitMaskComposite: "xor",
});

// one colored slab of a block. a plain block is one piece, a C block is an
// arm on top, a spine down the left, more arms between bodies and a foot
function BlockPiece({
  colorClassName,
  notch,
  bump,
  className,
  children,
}: {
  colorClassName: string;
  notch?: ConnectorSpot;
  bump?: ConnectorSpot;
  className?: string;
  children?: ReactNode;
}) {
  // the bump lives next to the slab, not in it: the notch mask on the slab
  // would clip anything that sticks out of its box
  return (
    <div className="relative">
      <div
        style={notch === undefined ? undefined : getNotchMask(notch)}
        className={cn(
          // a darker bottom edge for depth. inset, so it stays inside the
          // slab's shape instead of leaking through the next block's notch
          "shadow-[inset_0_-2px_0_rgb(0_0_0/0.18)]",
          colorClassName,
          className,
        )}
      >
        {children}
      </div>
      {bump !== undefined && (
        <span
          aria-hidden
          // half a pixel bigger all round than the hole it fills, so the
          // hole's soft antialiased edge never shows a dark outline
          style={{
            left: bump - 0.5,
            width: CONNECTOR_WIDTH + 1,
            height: CONNECTOR_DEPTH + 0.5,
          }}
          className={cn(
            "absolute top-full z-10 [clip-path:polygon(0_0,100%_0,75%_100%,25%_100%)]",
            colorClassName,
          )}
        />
      )}
    </div>
  );
}

const SLOT_CLASS =
  "h-6 rounded-full px-2 text-sm font-semibold text-white leading-none";
const PART_ROW_CLASS =
  "flex min-h-9 items-center gap-1.5 px-2.5 py-1.5 whitespace-nowrap";

function FieldSelect({
  value,
  options,
  slotClassName,
  isStatic,
  onChange,
}: {
  value: string;
  options: string[];
  slotClassName: string;
  isStatic: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <Select {...{ value }} onValueChange={onChange} disabled={isStatic}>
      {/* the raw radix trigger, shadcn's one brings borders and dark mode
      tints that fight the block colors */}
      <SelectPrimitive.Trigger
        className={cn(
          SLOT_CLASS,
          slotClassName,
          "inline-flex items-center gap-0.5 pr-1 outline-none focus-visible:ring-2 focus-visible:ring-white/70",
        )}
      >
        <SelectValue />
        <Icon icon={ArrowDown01Icon} className="size-3.5 opacity-70" />
      </SelectPrimitive.Trigger>
      <SelectContent position="item-aligned">
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// the hexagon a true/false block and its slot share
const BOOLEAN_SHAPE =
  "[clip-path:polygon(10px_0,calc(100%-10px)_0,100%_50%,calc(100%-10px)_100%,10px_100%,0_50%)]";

function InputSlot({
  node,
  part,
  slotClassName,
  isStatic,
}: {
  node: BlockNode;
  part: Extract<BlockPart, { kind: PartKind.Input }>;
  slotClassName: string;
  isStatic: boolean;
}) {
  const { setField, dropTarget } = useBlockEditor();
  const plugged = node.inputs[part.id];
  if (plugged) return <BlockView node={plugged} {...{ isStatic }} />;

  const isDropTarget =
    dropTarget?.kind === DropKind.Input &&
    dropTarget.nodeId === node.id &&
    dropTarget.inputId === part.id;
  const value = node.fields[part.id] ?? "";

  return (
    <span
      // only empty slots take a drop, the editor finds them by these
      data-drop-input={isStatic ? undefined : part.id}
      data-drop-node={node.id}
      data-accepts={part.accepts}
      className={cn(
        "inline-flex rounded-full transition-[scale,box-shadow] duration-100",
        isDropTarget && "scale-110 ring-2 ring-white",
      )}
    >
      {part.accepts === ValueType.Boolean ? (
        // true/false only comes from a block (compare), there's nothing to type
        <span className={cn("h-6 w-12", BOOLEAN_SHAPE, slotClassName)} />
      ) : (
        <input
          {...{ value }}
          readOnly={isStatic}
          tabIndex={isStatic ? -1 : undefined}
          aria-label={part.id}
          inputMode={part.accepts === ValueType.Number ? "decimal" : "text"}
          onChange={(event) => setField(node.id, part.id, event.target.value)}
          className={cn(
            SLOT_CLASS,
            slotClassName,
            "field-sizing-content min-w-7 text-center outline-none focus:ring-2 focus:ring-white/70",
            isStatic && "pointer-events-none",
          )}
        />
      )}
    </span>
  );
}

type InlinePartShape = Exclude<BlockPart, { kind: PartKind.Body }>;

function InlinePart({
  node,
  part,
  slotClassName,
  isStatic,
}: {
  node: BlockNode;
  part: InlinePartShape;
  slotClassName: string;
  isStatic: boolean;
}) {
  const { setField } = useBlockEditor();
  if (part.kind === PartKind.Text)
    return <span className="font-semibold">{part.text}</span>;
  if (part.kind === PartKind.Input)
    return <InputSlot {...{ node, part, slotClassName, isStatic }} />;
  return (
    <FieldSelect
      value={node.fields[part.id] ?? ""}
      options={part.kind === PartKind.Variable ? VARIABLE_NAMES : part.options}
      onChange={(value) => setField(node.id, part.id, value)}
      {...{ slotClassName, isStatic }}
    />
  );
}

// "times" can be both a word and a slot id (repeat 3 times), so the kind is in the key too
const getPartKey = (part: BlockPart) =>
  `${part.kind}-${"id" in part ? part.id : part.text}`;

const isInlinePart = (part: BlockPart): part is InlinePartShape =>
  part.kind !== PartKind.Body;

type BlockSection =
  | { kind: "row"; parts: InlinePartShape[]; key: string }
  | { kind: "body"; bodyId: string; key: string };

// a definition's rows become the block's slabs: inline rows turn into arms,
// a body row is the open mouth between them
function getSections(rows: BlockPart[][]): BlockSection[] {
  return rows.map((row) => {
    const body = row.find((part) => part.kind === PartKind.Body);
    if (body?.kind === PartKind.Body)
      return { kind: "body", bodyId: body.id, key: `body-${body.id}` };
    return {
      kind: "row",
      parts: row.filter(isInlinePart),
      key: row.map(getPartKey).join("-"),
    };
  });
}

function StatementBlock({
  node,
  isStatic,
}: {
  node: BlockNode;
  isStatic: boolean;
}) {
  const definition = getBlockDefinition(node.type);
  const style = CATEGORY_STYLES[definition.category];
  const sections = getSections(definition.rows);
  const isCBlock = sections.some((section) => section.kind === "body");

  const renderRow = (parts: InlinePartShape[], isFirst: boolean) => (
    <div className={PART_ROW_CLASS}>
      {isFirst && <Icon icon={definition.icon} className="size-4 opacity-80" />}
      {parts.map((part) => (
        <InlinePart
          key={getPartKey(part)}
          slotClassName={style.slot}
          {...{ node, part, isStatic }}
        />
      ))}
    </div>
  );

  if (!isCBlock)
    return (
      <BlockPiece
        colorClassName={style.block}
        notch={ConnectorSpot.Outer}
        bump={ConnectorSpot.Outer}
        className="min-w-40 rounded-[5px]"
      >
        {sections.map(
          (section) =>
            section.kind === "row" && (
              <div key={section.key}>{renderRow(section.parts, true)}</div>
            ),
        )}
      </BlockPiece>
    );

  // each arm knows if a body sits above it (then its notch is the inner one,
  // for that body's last block) and below it (then an inner bump for the first)
  return (
    <div className="flex min-w-44 flex-col">
      {sections.map((section, index) => {
        const hasBodyAbove = sections[index - 1]?.kind === "body";
        const hasBodyBelow = sections[index + 1]?.kind === "body";
        if (section.kind === "body")
          return (
            <div key={section.key} className="flex">
              <div
                style={{ width: SPINE_WIDTH }}
                className={cn("shrink-0", style.block)}
              />
              <StatementList
                listKey={getBodyListKey(node.id, section.bodyId)}
                nodes={node.bodies[section.bodyId] ?? []}
                className="min-h-7 min-w-24"
                {...{ isStatic }}
              />
            </div>
          );
        return (
          <BlockPiece
            key={section.key}
            colorClassName={style.block}
            notch={index === 0 ? ConnectorSpot.Outer : ConnectorSpot.Inner}
            bump={hasBodyBelow ? ConnectorSpot.Inner : undefined}
            className={cn(
              "rounded-[5px]",
              hasBodyAbove && "rounded-tl-none",
              hasBodyBelow && "rounded-bl-none",
            )}
          >
            {renderRow(section.parts, index === 0)}
          </BlockPiece>
        );
      })}
      {/* the foot closes the C and carries the bump for the next block */}
      <BlockPiece
        colorClassName={style.block}
        notch={ConnectorSpot.Inner}
        bump={ConnectorSpot.Outer}
        className="h-4 rounded-[5px] rounded-tl-none"
      />
    </div>
  );
}

function ExpressionBlock({
  node,
  isStatic,
}: {
  node: BlockNode;
  isStatic: boolean;
}) {
  const definition = getBlockDefinition(node.type);
  const style = CATEGORY_STYLES[definition.category];
  const isBoolean = definition.output === ValueType.Boolean;
  const parts = definition.rows.flat().filter(isInlinePart);

  return (
    <span
      className={cn(
        "inline-flex h-8 items-center gap-1 whitespace-nowrap",
        isBoolean ? cn(BOOLEAN_SHAPE, "px-3") : "rounded-full px-1",
        style.block,
      )}
    >
      {parts.map((part) => (
        <InlinePart
          key={getPartKey(part)}
          slotClassName={style.slot}
          {...{ node, part, isStatic }}
        />
      ))}
    </span>
  );
}

export function BlockView({
  node,
  isStatic = false,
}: {
  node: BlockNode;
  // palette copies and the drag ghost: look the same, fields don't edit
  isStatic?: boolean;
}) {
  const { startDrag, runningId } = useBlockEditor();
  const isExpression = "output" in getBlockDefinition(node.type);
  const isRunning = runningId === node.id;

  return (
    <div
      data-block={node.id}
      onPointerDown={(event) => startDrag(event, node)}
      className={cn(
        "relative w-max cursor-grab touch-none text-sm text-white select-none text-shadow-xs text-shadow-black/25",
        isExpression ? "inline-flex" : "flex flex-col",
        isRunning &&
          "z-20 brightness-110 drop-shadow-[0_0_6px_var(--color-yellow-300)]",
      )}
    >
      {isExpression ? (
        <ExpressionBlock {...{ node, isStatic }} />
      ) : (
        <StatementBlock {...{ node, isStatic }} />
      )}
    </div>
  );
}

// the hat that starts the main program: rounded cap, no notch (nothing goes
// above it), a bump for the first block
export function HatBlock({ children }: { children: ReactNode }) {
  return (
    <div className="w-max">
      <BlockPiece
        colorClassName="bg-amber-500"
        bump={ConnectorSpot.Outer}
        className="rounded-t-2xl rounded-b-md"
      >
        <div
          className={cn(
            PART_ROW_CLASS,
            "min-w-44 pt-3 text-sm font-semibold text-white",
          )}
        >
          {children}
        </div>
      </BlockPiece>
    </div>
  );
}

export function StatementList({
  listKey,
  nodes,
  className,
  isStatic = false,
}: {
  listKey: ListKey;
  nodes: BlockNode[];
  className?: string;
  isStatic?: boolean;
}) {
  const { dropTarget, dragHeight } = useBlockEditor();
  const gapIndex =
    dropTarget?.kind === DropKind.List && dropTarget.listKey === listKey
      ? dropTarget.index
      : undefined;
  // the stack spreads apart where the dragged blocks would land, so you see
  // exactly where they'll click in before letting go
  const gap = (
    <motion.div
      key="drop-gap"
      data-drop-gap
      initial={{ height: 0 }}
      animate={{ height: dragHeight }}
      transition={{ type: "spring", bounce: 0, duration: 0.2 }}
      className="w-40 rounded-md bg-foreground/15"
    />
  );

  return (
    <div
      data-list={isStatic ? undefined : listKey}
      className={cn("flex flex-col items-start", className)}
    >
      {nodes.flatMap((node, index) => {
        const block = <BlockView key={node.id} {...{ node, isStatic }} />;
        return index === gapIndex ? [gap, block] : [block];
      })}
      {gapIndex === nodes.length && gap}
    </div>
  );
}
