"use client";

import {
  Delete02Icon,
  PlayIcon,
  SquareIcon,
  Undo02Icon,
} from "@hugeicons/core-free-icons";
import { type PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { SlidingTabs } from "@/components/SlidingTabs";
import { Button } from "@/shadcn/ui/button";
import { cn } from "@/shadcn/utils";
import { triggerHaptic } from "@/utils/haptics";
import {
  BlockEditorContext,
  BlockView,
  DropKind,
  type DropTarget,
  StatementList,
} from "./BlockView";
import {
  BLOCK_TYPES,
  BlockCategory,
  type BlockNode,
  type BlockType,
  CATEGORY_STYLES,
  canPlugInto,
  getBlockDefinition,
  ValueType,
} from "./blocks";
import { ProgramStoppedError, programToCode, runProgram } from "./run";
import {
  createBlock,
  insertStatement,
  plugExpression,
  ROOT_LIST,
  removeBlock,
  setField,
} from "./tree";

// counter ids, not random ones, so the server and the browser build the
// exact same starting program and hydration doesn't trip
function makeIdGenerator(prefix: string) {
  const counter = { value: 0 };
  return () => `${prefix}-${counter.value++}`;
}

// the tip calculator from the scratch screenshot, rebuilt as blocks
function makeStarterProgram(): BlockNode[] {
  const getId = makeIdGenerator("starter");
  const block = (
    type: BlockType,
    parts: Partial<Pick<BlockNode, "fields" | "inputs" | "bodies">> = {},
  ): BlockNode => {
    const base = createBlock(type, getId);
    return {
      ...base,
      fields: { ...base.fields, ...parts.fields },
      inputs: { ...parts.inputs },
      bodies: { ...base.bodies, ...parts.bodies },
    };
  };
  const getVariable = (variable: string) =>
    block("getVariable", { fields: { variable } });
  const multiplyBill = (rate: string) =>
    block("math", {
      fields: { operator: "×", right: rate },
      inputs: { left: getVariable("bill") },
    });

  return [
    block("setVariable", { fields: { variable: "bill", value: "84" } }),
    block("setVariable", { fields: { variable: "people", value: "3" } }),
    block("ifElse", {
      inputs: {
        condition: block("compare", {
          fields: { operator: ">", right: "50" },
          inputs: { left: getVariable("bill") },
        }),
      },
      bodies: {
        whenTrue: [
          block("setVariable", {
            fields: { variable: "tip" },
            inputs: { value: multiplyBill("0.2") },
          }),
        ],
        whenFalse: [
          block("setVariable", {
            fields: { variable: "tip" },
            inputs: { value: multiplyBill("0.1") },
          }),
        ],
      },
    }),
    block("setVariable", {
      fields: { variable: "total" },
      inputs: {
        value: block("math", {
          fields: { operator: "÷" },
          inputs: {
            left: block("math", {
              fields: { operator: "+" },
              inputs: { left: getVariable("bill"), right: getVariable("tip") },
            }),
            right: getVariable("people"),
          },
        }),
      },
    }),
    block("say", {
      inputs: {
        message: block("join", {
          fields: { left: "each pays $" },
          inputs: { right: getVariable("total") },
        }),
      },
    }),
    block("repeat", {
      bodies: {
        body: [
          block("say", {
            inputs: {
              message: block("join", {
                fields: { left: "hip hip #" },
                inputs: { right: getVariable("i") },
              }),
            },
          }),
        ],
      },
    }),
  ];
}

const createRandomId = () => crypto.randomUUID();

// typing in a slot or opening a dropdown shouldn't pick the block up
const isEditableTarget = (target: EventTarget) =>
  target instanceof Element &&
  Boolean(target.closest("input:not([readonly]), button:not(:disabled)"));

// the pointer has to travel this far before a press becomes a drag, so a
// click into a slot to type still just focuses it
const DRAG_THRESHOLD_PX = 5;

type Drag = {
  node: BlockNode;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
};

// what's under the pointer: the palette (drop = delete), an empty slot that
// takes this block's type, or a spot between two statements
function findDropTarget(
  x: number,
  y: number,
  node: BlockNode,
): DropTarget | undefined {
  const elements = document.elementsFromPoint(x, y);
  if (elements.some((element) => element.closest("[data-palette]")))
    return { kind: DropKind.Trash };

  const { output } = getBlockDefinition(node.type);
  if (output) {
    const slot = elements.find(
      (element) =>
        element instanceof HTMLElement &&
        element.dataset.dropInput &&
        canPlugInto(
          output,
          (element.dataset.accepts as ValueType | undefined) ?? ValueType.Any,
        ),
    );
    if (!(slot instanceof HTMLElement)) return undefined;
    return {
      kind: DropKind.Input,
      nodeId: slot.dataset.dropNode ?? "",
      inputId: slot.dataset.dropInput ?? "",
    };
  }

  // topmost list under the pointer is the most deeply nested one
  const list = elements.find(
    (element) => element instanceof HTMLElement && element.dataset.list,
  );
  if (!(list instanceof HTMLElement) || !list.dataset.list) return undefined;
  const blocksAbovePointer = [
    ...list.querySelectorAll(":scope > [data-block]"),
  ].filter((block) => {
    const rect = block.getBoundingClientRect();
    return rect.top + rect.height / 2 < y;
  });
  return {
    kind: DropKind.List,
    listKey: list.dataset.list,
    index: blocksAbovePointer.length,
  };
}

function applyDrop(
  program: BlockNode[],
  target: DropTarget,
  node: BlockNode,
): BlockNode[] {
  if (target.kind === DropKind.List)
    return insertStatement(program, target.listKey, target.index, node);
  if (target.kind === DropKind.Input)
    return plugExpression(program, target.nodeId, target.inputId, node);
  // dropped on the palette, it's gone
  return program;
}

const CATEGORY_TABS = Object.values(BlockCategory).map((category) => ({
  value: category,
  label: CATEGORY_STYLES[category].label,
  icon: CATEGORY_STYLES[category].icon,
}));

const getPaletteBlocks = (category: BlockCategory) =>
  BLOCK_TYPES.filter(
    (type) => getBlockDefinition(type).category === category,
  ).map((type) => createBlock(type, () => `palette-${type}`));

export function BlockEditor() {
  const [program, setProgram] = useState(makeStarterProgram);
  const [category, setCategory] = useState(BlockCategory.Variables);
  const [drag, setDrag] = useState<Drag>();
  const [dropTarget, setDropTarget] = useState<DropTarget>();
  const [runningId, setRunningId] = useState<string>();
  const [output, setOutput] = useState<{ id: string; text: string }[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const runAbortController = useRef<AbortController>(undefined);
  const programRef = useRef(program);
  useEffect(() => {
    programRef.current = program;
  });

  const paletteBlocks = useMemo(() => getPaletteBlocks(category), [category]);
  const code = useMemo(() => programToCode(program), [program]);

  const startDrag = (
    event: PointerEvent<HTMLElement>,
    pressedNode: BlockNode,
  ) => {
    // the innermost block under the finger wins, not every block around it
    event.stopPropagation();
    if (event.button !== 0 || isRunning || isEditableTarget(event.target))
      return;
    const isFromPalette = pressedNode.id.startsWith("palette-");
    const rect = event.currentTarget.getBoundingClientRect();
    const start = { x: event.clientX, y: event.clientY };
    const offset = { x: start.x - rect.left, y: start.y - rect.top };
    const state: {
      node: BlockNode;
      snapshot: BlockNode[];
      isDragging: boolean;
      target: DropTarget | undefined;
    } = {
      // a palette block hands out a brand new copy every time
      node: isFromPalette
        ? createBlock(pressedNode.type, createRandomId)
        : pressedNode,
      snapshot: programRef.current,
      isDragging: false,
      target: undefined,
    };

    const handleMove = (moveEvent: globalThis.PointerEvent) => {
      const distance = Math.hypot(
        moveEvent.clientX - start.x,
        moveEvent.clientY - start.y,
      );
      if (!state.isDragging && distance < DRAG_THRESHOLD_PX) return;
      if (!state.isDragging) {
        state.isDragging = true;
        triggerHaptic("selection");
        if (!isFromPalette)
          setProgram((current) => removeBlock(current, pressedNode.id));
      }
      state.target = findDropTarget(
        moveEvent.clientX,
        moveEvent.clientY,
        state.node,
      );
      setDropTarget(state.target);
      setDrag({
        node: state.node,
        x: moveEvent.clientX,
        y: moveEvent.clientY,
        offsetX: offset.x,
        offsetY: offset.y,
      });
    };

    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
      if (!state.isDragging) return;
      const { target, node, snapshot } = state;
      if (target) {
        triggerHaptic(target.kind === DropKind.Trash ? "warning" : "light");
        setProgram((current) => applyDrop(current, target, node));
      } else if (!isFromPalette) setProgram(snapshot);
      setDrag(undefined);
      setDropTarget(undefined);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
  };

  const run = async () => {
    const controller = new AbortController();
    runAbortController.current = controller;
    setOutput([]);
    setIsRunning(true);
    try {
      await runProgram({
        program,
        stepMs: 350,
        onStep: setRunningId,
        say: (text) =>
          setOutput((lines) => [...lines, { id: createRandomId(), text }]),
        signal: controller.signal,
      });
      triggerHaptic("success");
    } catch (error) {
      if (!(error instanceof ProgramStoppedError)) throw error;
    } finally {
      setIsRunning(false);
    }
  };

  const editor = {
    startDrag,
    setField: (nodeId: string, fieldId: string, value: string) =>
      setProgram((current) => setField(current, nodeId, fieldId, value)),
    dropTarget,
    runningId,
  };

  return (
    <BlockEditorContext.Provider value={editor}>
      <div
        className={cn(
          "grid gap-4 lg:grid-cols-[18rem_1fr_20rem]",
          drag && "cursor-grabbing [&_*]:cursor-grabbing!",
        )}
      >
        <section
          data-palette
          className={cn(
            "relative flex flex-col gap-3 self-start rounded-2xl bg-muted p-3 lg:sticky lg:top-4",
            dropTarget?.kind === DropKind.Trash && "ring-2 ring-destructive",
          )}
        >
          <SlidingTabs
            tabs={CATEGORY_TABS}
            value={category}
            onValueChange={setCategory}
            className="flex-wrap"
          />
          <div className="flex flex-wrap items-start gap-2">
            {paletteBlocks.map((node) => (
              <BlockView key={node.id} {...{ node }} isStatic />
            ))}
          </div>
          {dropTarget?.kind === DropKind.Trash && (
            <div className="absolute inset-0 grid place-items-center rounded-2xl bg-destructive/15 text-destructive backdrop-blur-sm">
              <span className="flex items-center gap-2 font-semibold">
                <Icon icon={Delete02Icon} className="size-6" />
                drop to delete
              </span>
            </div>
          )}
        </section>

        <section className="flex min-w-0 flex-col gap-3 overflow-x-auto rounded-2xl bg-muted/50 p-4">
          <div className="flex items-center gap-2">
            <Button
              onClick={() =>
                isRunning ? runAbortController.current?.abort() : run()
              }
              className={cn(
                !isRunning && "bg-green-600 hover:bg-green-700 text-white",
              )}
            >
              <Icon icon={isRunning ? SquareIcon : PlayIcon} />
              {isRunning ? "Stop" : "Run"}
            </Button>
            <Button
              variant="ghost"
              disabled={isRunning}
              onClick={() => {
                setProgram(makeStarterProgram());
                setOutput([]);
              }}
            >
              <Icon icon={Undo02Icon} />
              Reset
            </Button>
          </div>
          <div className="flex w-max items-center gap-2 rounded-t-2xl rounded-b-md bg-amber-500 px-3 py-2 text-sm font-semibold text-white shadow-sm">
            <Icon icon={PlayIcon} className="size-4" />
            When Run is clicked
          </div>
          <StatementList
            listKey={ROOT_LIST}
            nodes={program}
            // room under the last block so there's always somewhere to drop
            className="-mt-3 min-h-40 pb-24"
          />
        </section>

        <section className="flex min-w-0 flex-col gap-3 self-start lg:sticky lg:top-4">
          <div className="flex min-h-28 flex-col gap-1 rounded-2xl bg-muted p-3 font-mono text-sm">
            <span className="text-xs font-sans font-medium text-muted-foreground">
              Output
            </span>
            {output.length === 0 && (
              <span className="text-muted-foreground">press Run</span>
            )}
            {output.map(({ id, text }) => (
              <span
                key={id}
                className="animate-in fade-in slide-in-from-bottom-1"
              >
                {text}
              </span>
            ))}
          </div>
          <pre className="overflow-x-auto rounded-2xl bg-muted p-3 text-xs leading-relaxed">
            <span className="mb-1 block font-sans font-medium text-muted-foreground">
              Same program as JavaScript
            </span>
            {code}
          </pre>
        </section>
      </div>

      {drag && (
        <div
          aria-hidden
          className="pointer-events-none fixed top-0 left-0 z-50 rotate-2 opacity-90 drop-shadow-xl"
          style={{
            translate: `${drag.x - drag.offsetX}px ${drag.y - drag.offsetY}px`,
          }}
        >
          <BlockView node={drag.node} isStatic />
        </div>
      )}
    </BlockEditorContext.Provider>
  );
}
