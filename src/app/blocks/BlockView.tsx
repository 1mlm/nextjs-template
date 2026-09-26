"use client";

import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { Select as SelectPrimitive } from "radix-ui";
import { createContext, type PointerEvent, useContext } from "react";
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
  Trash = "trash",
}

export type DropTarget =
  | { kind: DropKind.List; listKey: ListKey; index: number }
  | { kind: DropKind.Input; nodeId: string; inputId: string }
  | { kind: DropKind.Trash };

type BlockEditorContextValue = {
  startDrag: (event: PointerEvent<HTMLElement>, node: BlockNode) => void;
  setField: (nodeId: string, fieldId: string, value: string) => void;
  dropTarget: DropTarget | undefined;
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

// the scratch look: a notch dented into the top, a bump sticking out of the
// bottom, so stacked blocks look like they click into each other
const STATEMENT_SHAPE =
  "relative rounded-lg px-2.5 py-2 shadow-sm shadow-black/30 before:absolute before:top-0 before:left-4 before:h-1.5 before:w-7 before:rounded-b-md before:bg-black/25 after:absolute after:-bottom-1.5 after:left-4 after:z-10 after:h-1.5 after:w-7 after:rounded-b-md after:bg-(--notch)";
const EXPRESSION_SHAPE =
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 ring-1 ring-black/20";
const SLOT_CLASS = "h-6 rounded-full px-2 text-sm font-medium text-white";

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
        <span
          className={cn(
            "h-6 w-12 [clip-path:polygon(12%_0,88%_0,100%_50%,88%_100%,12%_100%,0_50%)]",
            slotClassName,
          )}
        />
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

function PartView({
  node,
  part,
  slotClassName,
  isStatic,
}: {
  node: BlockNode;
  part: BlockPart;
  slotClassName: string;
  isStatic: boolean;
}) {
  const { setField } = useBlockEditor();
  if (part.kind === PartKind.Text)
    return <span className="font-semibold">{part.text}</span>;
  if (part.kind === PartKind.Input)
    return <InputSlot {...{ node, part, slotClassName, isStatic }} />;
  if (part.kind === PartKind.Variable || part.kind === PartKind.Option)
    return (
      <FieldSelect
        value={node.fields[part.id] ?? ""}
        options={
          part.kind === PartKind.Variable ? VARIABLE_NAMES : part.options
        }
        onChange={(value) => setField(node.id, part.id, value)}
        {...{ slotClassName, isStatic }}
      />
    );
  return (
    <StatementList
      listKey={getBodyListKey(node.id, part.id)}
      nodes={node.bodies[part.id] ?? []}
      // the inside of a C block shows the canvas through, so the block
      // reads as wrapping around whatever you drop in there
      className="-mr-2.5 my-1.5 ml-3 min-h-9 rounded-l-md bg-background/85 py-1.5 pl-1.5"
      {...{ isStatic }}
    />
  );
}

// "times" can be both a word and a slot id (repeat 3 times), so the kind is in the key too
const getPartKey = (part: BlockPart) =>
  `${part.kind}-${"id" in part ? part.id : part.text}`;

export function BlockView({
  node,
  isStatic = false,
}: {
  node: BlockNode;
  // palette copies and the drag ghost: look the same, fields don't edit
  isStatic?: boolean;
}) {
  const { startDrag, runningId } = useBlockEditor();
  const definition = getBlockDefinition(node.type);
  const style = CATEGORY_STYLES[definition.category];
  const isExpression = "output" in definition;
  const isRunning = runningId === node.id;

  return (
    <div
      data-block={node.id}
      onPointerDown={(event) => startDrag(event, node)}
      className={cn(
        "cursor-grab touch-none text-sm text-white select-none text-shadow-xs text-shadow-black/20",
        style.block,
        isExpression ? EXPRESSION_SHAPE : cn(STATEMENT_SHAPE, "w-max min-w-44"),
        isRunning &&
          "z-20 scale-[1.03] ring-3 ring-yellow-300 transition-[scale] duration-100",
      )}
    >
      {definition.rows.map((row) => {
        const rowKey = row.map(getPartKey).join("-");
        const isBodyRow = row.some((part) => part.kind === PartKind.Body);
        if (isBodyRow)
          return row.map((part) => (
            <PartView
              key={rowKey}
              slotClassName={style.slot}
              {...{ node, part, isStatic }}
            />
          ));
        return (
          <div key={rowKey} className="flex flex-wrap items-center gap-1.5">
            {row === definition.rows[0] && !isExpression && (
              <Icon icon={definition.icon} className="size-4 opacity-80" />
            )}
            {row.map((part) => (
              <PartView
                key={getPartKey(part)}
                slotClassName={style.slot}
                {...{ node, part, isStatic }}
              />
            ))}
          </div>
        );
      })}
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
  const { dropTarget } = useBlockEditor();
  const dropIndex =
    dropTarget?.kind === DropKind.List && dropTarget.listKey === listKey
      ? dropTarget.index
      : undefined;
  const dropLine = (
    <div
      key="drop-line"
      className="my-0.5 h-1.5 w-40 animate-pulse rounded-full bg-foreground/60"
    />
  );

  return (
    <div
      data-list={isStatic ? undefined : listKey}
      className={cn("flex flex-col items-start", className)}
    >
      {nodes.flatMap((node, index) => {
        const block = <BlockView key={node.id} {...{ node, isStatic }} />;
        return index === dropIndex ? [dropLine, block] : [block];
      })}
      {dropIndex === nodes.length && dropLine}
    </div>
  );
}
