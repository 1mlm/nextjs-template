"use client";

import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { motion } from "motion/react";
import { Select as SelectPrimitive } from "radix-ui";
import {
  createContext,
  type PointerEvent,
  type ReactNode,
  type RefObject,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
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
  type BlockSectionBox,
  getHatPath,
  getStatementPath,
  SPINE_WIDTH,
} from "./blockShape";
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

type MeasuredShape = { path: string; width: number; height: number };

// measures the block and its arms/mouths (fractional pixels, straight from
// the layout) and rebuilds the outline whenever anything inside resizes
function useMeasuredShape(
  rootRef: RefObject<HTMLDivElement | null>,
  getPath: (
    width: number,
    height: number,
    sections: BlockSectionBox[],
  ) => string,
) {
  const [shape, setShape] = useState<MeasuredShape>();
  const getPathRef = useRef(getPath);
  useLayoutEffect(() => {
    getPathRef.current = getPath;
  });

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const sectionElements = [
      ...root.querySelectorAll<HTMLElement>(":scope > [data-section]"),
    ];
    const measure = () => {
      const rootRect = root.getBoundingClientRect();
      const sections = sectionElements.map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          kind: element.dataset.section === "mouth" ? "mouth" : "arm",
          top: rect.top - rootRect.top,
          height: rect.height,
        } satisfies BlockSectionBox;
      });
      setShape({
        path: getPathRef.current(rootRect.width, rootRect.height, sections),
        width: rootRect.width,
        height: rootRect.height,
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    for (const element of sectionElements) observer.observe(element);
    return () => observer.disconnect();
  }, [rootRef]);

  return shape;
}

// the block's painted outline, behind its content. overflow visible: the
// bump hangs below the box. the shadow falls on whatever is behind: the
// canvas, or the C block around it (depth inside its mouth). the block
// stacked below paints over it, so joints stay seamless
function BlockShape({
  shape,
  fillClassName,
}: {
  shape: MeasuredShape | undefined;
  fillClassName: string;
}) {
  if (!shape) return null;
  return (
    <svg
      aria-hidden="true"
      width={shape.width}
      height={shape.height}
      className={cn(
        "pointer-events-none absolute top-0 left-0 -z-10 overflow-visible [filter:drop-shadow(0_2px_0_rgb(0_0_0/0.3))_drop-shadow(0_4px_8px_rgb(0_0_0/0.25))]",
        fillClassName,
      )}
    >
      <path d={shape.path} fillRule="nonzero" />
    </svg>
  );
}

const SLOT_CLASS =
  "h-6 rounded-full px-2 text-sm font-semibold text-white leading-none";
const PART_ROW_CLASS =
  "flex min-h-9 items-center gap-1.5 px-2.5 py-1.5 whitespace-nowrap";
// true/false blocks and their slots: a pill with its ends pinched into soft
// points, still curved everywhere (no sharp hexagon corners)
const BOOLEAN_SHAPE = "rounded-[12px] corner-superellipse/0.5";

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

// a definition's rows become the block's parts: inline rows turn into arms,
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
  hasBlockAbove,
  hasBlockBelow,
}: {
  node: BlockNode;
  isStatic: boolean;
  hasBlockAbove: boolean;
  hasBlockBelow: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const definition = getBlockDefinition(node.type);
  const style = CATEGORY_STYLES[definition.category];
  const sections = getSections(definition.rows);
  const isCBlock = sections.some((section) => section.kind === "body");
  const shape = useMeasuredShape(rootRef, (width, _height, boxes) =>
    getStatementPath({
      width,
      sections: boxes,
      hasBlockAbove,
      hasBlockBelow,
    }),
  );

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative isolate flex flex-col transition-opacity duration-150",
        isCBlock ? "min-w-44" : "min-w-40",
        // invisible until measured, so it never flashes without its outline
        !shape && "opacity-0",
      )}
    >
      <BlockShape {...{ shape }} fillClassName={style.fill} />
      {sections.map((section, index) =>
        section.kind === "body" ? (
          <div
            key={section.key}
            data-section="mouth"
            style={{ paddingLeft: SPINE_WIDTH }}
            className="flex"
          >
            <StatementList
              listKey={getBodyListKey(node.id, section.bodyId)}
              nodes={node.bodies[section.bodyId] ?? []}
              className="min-h-7 min-w-24"
              {...{ isStatic }}
            />
          </div>
        ) : (
          <div key={section.key} data-section="arm" className={PART_ROW_CLASS}>
            {index === 0 && (
              <Icon icon={definition.icon} className="size-4 opacity-80" />
            )}
            {section.parts.map((part) => (
              <InlinePart
                key={getPartKey(part)}
                slotClassName={style.slot}
                {...{ node, part, isStatic }}
              />
            ))}
          </div>
        ),
      )}
      {/* the foot that closes a C and carries the bump for the next block */}
      {isCBlock && <div data-section="arm" className="h-4" />}
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
  hasBlockAbove = false,
  hasBlockBelow = false,
}: {
  node: BlockNode;
  // palette copies and the drag ghost: look the same, fields don't edit
  isStatic?: boolean;
  hasBlockAbove?: boolean;
  hasBlockBelow?: boolean;
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
        <StatementBlock {...{ node, isStatic, hasBlockAbove, hasBlockBelow }} />
      )}
    </div>
  );
}

// the hat that starts the main program: tall rounded cap, no hole (nothing
// goes above it), a bump for the first block
export function HatBlock({
  hasBlockBelow,
  children,
}: {
  hasBlockBelow: boolean;
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const shape = useMeasuredShape(rootRef, (width, height) =>
    getHatPath(width, height, hasBlockBelow),
  );

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative isolate w-max transition-opacity duration-150",
        !shape && "opacity-0",
      )}
    >
      <BlockShape {...{ shape }} fillClassName="fill-amber-500" />
      <div
        className={cn(
          PART_ROW_CLASS,
          "min-w-44 pt-3 text-sm font-semibold text-white",
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function StatementList({
  listKey,
  nodes,
  className,
  isStatic = false,
  isUnderHat = false,
}: {
  listKey: ListKey;
  nodes: BlockNode[];
  className?: string;
  isStatic?: boolean;
  // the main stack: its first block sits right under the Run hat
  isUnderHat?: boolean;
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
      className="w-40 rounded-l-[10px] rounded-r-[20px] bg-foreground/15"
    />
  );

  return (
    <div
      data-list={isStatic ? undefined : listKey}
      className={cn("flex flex-col items-start", className)}
    >
      {nodes.flatMap((node, index) => {
        const block = (
          <BlockView
            key={node.id}
            {...{ node, isStatic }}
            // a block with another right under it reaches under that one
            // (see blockShape), an opening drop gap below counts as nothing
            hasBlockAbove={gapIndex !== index && (index > 0 || isUnderHat)}
            hasBlockBelow={index < nodes.length - 1 && gapIndex !== index + 1}
          />
        );
        return index === gapIndex ? [gap, block] : [block];
      })}
      {gapIndex === nodes.length && gap}
    </div>
  );
}
