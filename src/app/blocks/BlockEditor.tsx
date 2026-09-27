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
  HatBlock,
  StatementList,
} from "./BlockView";
import {
  BLOCK_TYPES,
  BlockCategory,
  type BlockNode,
  CATEGORY_STYLES,
  canPlugInto,
  getBlockDefinition,
  ValueType,
} from "./blocks";
import { ProgramStoppedError, programToCode, runProgram } from "./run";
import { makeStarterProgram } from "./starter";
import {
  addLooseStack,
  createBlock,
  getLooseListKey,
  insertStack,
  pickUp,
  plugExpression,
  ROOT_LIST,
  setField,
  type Workspace,
} from "./tree";

const createRandomId = () => crypto.randomUUID();

const makeStarterWorkspace = (): Workspace => ({
  program: makeStarterProgram(),
  looseStacks: [],
});

// typing in a slot or opening a dropdown shouldn't pick the block up
const isEditableTarget = (target: EventTarget) =>
  target instanceof Element &&
  Boolean(target.closest("input:not([readonly]), button:not(:disabled)"));

// the pointer has to travel this far before a press becomes a drag, so a
// click into a slot to type still just focuses it
const DRAG_THRESHOLD_PX = 5;
// how close the dragged block's corner has to get to a connection point (or
// an expression to an empty slot) before it snaps there
const SNAP_RADIUS_PX = 44;

type Drag = { blocks: BlockNode[]; x: number; y: number };

const getDistance = (ax: number, ay: number, bx: number, by: number) =>
  Math.hypot(ax - bx, ay - by);

const isDropGap = (element: Element) =>
  element instanceof HTMLElement && "dropGap" in element.dataset;

// every spot a stack can click into: above each block of every list and
// under its last one. the opened gap is measured out so the spots below it
// don't jump around while it grows
function getConnectionPoints() {
  return [...document.querySelectorAll<HTMLElement>("[data-list]")].flatMap(
    (list) => {
      const listKey = list.dataset.list ?? "";
      const listRect = list.getBoundingClientRect();
      const children = [...list.children];
      const gapIndex = children.findIndex(isDropGap);
      const gapHeight = children[gapIndex]?.getBoundingClientRect().height ?? 0;
      const blockRects = children.flatMap((child, childIndex) => {
        if (!(child instanceof HTMLElement) || !("block" in child.dataset))
          return [];
        const rect = child.getBoundingClientRect();
        const shift = gapIndex !== -1 && childIndex > gapIndex ? gapHeight : 0;
        return [{ top: rect.top - shift, bottom: rect.bottom - shift }];
      });
      const lastBottom = blockRects.at(-1)?.bottom ?? listRect.top;
      return [
        ...blockRects.map((rect, index) => ({ listKey, index, y: rect.top })),
        { listKey, index: blockRects.length, y: lastBottom },
      ].map((point) => ({ ...point, x: listRect.left }));
    },
  );
}

const getNearest = <T extends { distance: number }>(candidates: T[]) =>
  candidates
    .filter(({ distance }) => distance < SNAP_RADIUS_PX)
    .toSorted((a, b) => a.distance - b.distance)[0];

function findNearestSlot(
  output: ValueType,
  left: number,
  middleY: number,
): DropTarget | undefined {
  const slots = [
    ...document.querySelectorAll<HTMLElement>("[data-drop-input]"),
  ].flatMap((slot) => {
    const accepts =
      (slot.dataset.accepts as ValueType | undefined) ?? ValueType.Any;
    if (!canPlugInto(output, accepts)) return [];
    const rect = slot.getBoundingClientRect();
    const slotMiddleY = rect.top + rect.height / 2;
    return [
      {
        nodeId: slot.dataset.dropNode ?? "",
        inputId: slot.dataset.dropInput ?? "",
        distance: getDistance(left, middleY, rect.left, slotMiddleY),
      },
    ];
  });
  const slot = getNearest(slots);
  return (
    slot && {
      kind: DropKind.Input,
      nodeId: slot.nodeId,
      inputId: slot.inputId,
    }
  );
}

function findNearestConnection(
  left: number,
  top: number,
): DropTarget | undefined {
  const points = getConnectionPoints().map((point) => ({
    ...point,
    distance: getDistance(left, top, point.x, point.y),
  }));
  const point = getNearest(points);
  return (
    point && {
      kind: DropKind.List,
      listKey: point.listKey,
      index: point.index,
    }
  );
}

function findCanvasSpot(
  pointerElements: Element[],
  left: number,
  top: number,
): DropTarget | undefined {
  const canvas = document.querySelector<HTMLElement>("[data-canvas]");
  const isOverCanvas =
    canvas && pointerElements.some((element) => canvas.contains(element));
  if (!isOverCanvas) return undefined;
  const canvasRect = canvas.getBoundingClientRect();
  return {
    kind: DropKind.Canvas,
    x: left - canvasRect.left + canvas.scrollLeft,
    y: top - canvasRect.top + canvas.scrollTop,
  };
}

// where letting go right now would put the dragged blocks: the palette
// (delete), a snap point or slot near the block's corner (scratch snaps by
// the block, not the cursor), or loose on the canvas
function findDropTarget({
  pointerX,
  pointerY,
  left,
  top,
  height,
  blocks,
}: {
  pointerX: number;
  pointerY: number;
  left: number;
  top: number;
  height: number;
  blocks: BlockNode[];
}): DropTarget | undefined {
  const pointerElements = document.elementsFromPoint(pointerX, pointerY);
  const isOverPalette = pointerElements.some((element) =>
    element.closest("[data-palette]"),
  );
  if (isOverPalette) return { kind: DropKind.Trash };

  const firstBlock = blocks[0];
  const output = firstBlock && getBlockDefinition(firstBlock.type).output;
  const snapTarget =
    output && blocks.length === 1
      ? findNearestSlot(output, left, top + height / 2)
      : findNearestConnection(left, top);
  return snapTarget ?? findCanvasSpot(pointerElements, left, top);
}

function applyDrop(
  workspace: Workspace,
  target: DropTarget,
  blocks: BlockNode[],
): Workspace {
  if (target.kind === DropKind.List)
    return insertStack(workspace, target.listKey, target.index, blocks);
  const firstBlock = blocks[0];
  if (target.kind === DropKind.Input && firstBlock)
    return plugExpression(workspace, target.nodeId, target.inputId, firstBlock);
  if (target.kind === DropKind.Canvas)
    return addLooseStack(workspace, {
      id: createRandomId(),
      x: Math.max(target.x, 0),
      y: Math.max(target.y, 0),
      blocks,
    });
  // dropped on the palette, gone
  return workspace;
}

// the pressed block plus the blocks under it in the same list, top of the
// first to bottom of the last, the height of the gap it'll need
function getStackHeight(pressed: HTMLElement) {
  const siblings = [...(pressed.parentElement?.children ?? [])];
  const blocksFromPressed = siblings
    .slice(siblings.indexOf(pressed))
    .filter(
      (element) => element instanceof HTMLElement && "block" in element.dataset,
    );
  const last = blocksFromPressed.at(-1) ?? pressed;
  return (
    last.getBoundingClientRect().bottom - pressed.getBoundingClientRect().top
  );
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
  const [workspace, setWorkspace] = useState(makeStarterWorkspace);
  const [category, setCategory] = useState(BlockCategory.Variables);
  const [drag, setDrag] = useState<Drag>();
  const [dragHeight, setDragHeight] = useState(0);
  const [dropTarget, setDropTarget] = useState<DropTarget>();
  const [runningId, setRunningId] = useState<string>();
  const [output, setOutput] = useState<{ id: string; text: string }[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const runAbortController = useRef<AbortController>(undefined);
  const workspaceRef = useRef(workspace);
  useEffect(() => {
    workspaceRef.current = workspace;
  });

  const paletteBlocks = useMemo(() => getPaletteBlocks(category), [category]);
  const code = useMemo(
    () => programToCode(workspace.program),
    [workspace.program],
  );

  const startDrag = (
    event: PointerEvent<HTMLElement>,
    pressedNode: BlockNode,
  ) => {
    // the innermost block under the finger wins, not every block around it
    event.stopPropagation();
    if (event.button !== 0 || isRunning || isEditableTarget(event.target))
      return;
    const isFromPalette = pressedNode.id.startsWith("palette-");
    const pressed = event.currentTarget;
    const rect = pressed.getBoundingClientRect();
    const start = { x: event.clientX, y: event.clientY };
    const offset = { x: start.x - rect.left, y: start.y - rect.top };
    // a second finger dragging another block gets its own listeners
    const { pointerId } = event;
    const state: {
      blocks: BlockNode[];
      height: number;
      snapshot: Workspace;
      isDragging: boolean;
      target: DropTarget | undefined;
    } = {
      blocks: [],
      height: isFromPalette ? rect.height : getStackHeight(pressed),
      snapshot: workspaceRef.current,
      isDragging: false,
      target: undefined,
    };

    const beginDrag = () => {
      state.isDragging = true;
      triggerHaptic("selection");
      setDragHeight(state.height);
      // a palette block hands out a brand new copy every time
      if (isFromPalette) {
        state.blocks = [createBlock(pressedNode.type, createRandomId)];
        return;
      }
      const picked = pickUp(workspaceRef.current, pressedNode);
      state.blocks = picked.taken;
      setWorkspace(picked.workspace);
    };

    const handleMove = (moveEvent: globalThis.PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      const distance = getDistance(
        moveEvent.clientX,
        moveEvent.clientY,
        start.x,
        start.y,
      );
      if (!state.isDragging && distance < DRAG_THRESHOLD_PX) return;
      if (!state.isDragging) beginDrag();
      const left = moveEvent.clientX - offset.x;
      const top = moveEvent.clientY - offset.y;
      const target = findDropTarget({
        pointerX: moveEvent.clientX,
        pointerY: moveEvent.clientY,
        left,
        top,
        height: state.height,
        blocks: state.blocks,
      });
      // a little tick every time it snaps somewhere new
      const isNewSnap =
        target?.kind === DropKind.List &&
        (state.target?.kind !== DropKind.List ||
          state.target.listKey !== target.listKey ||
          state.target.index !== target.index);
      if (isNewSnap) triggerHaptic("selection");
      state.target = target;
      setDropTarget(target);
      setDrag({ blocks: state.blocks, x: left, y: top });
    };

    const handleUp = (upEvent: globalThis.PointerEvent) => {
      if (upEvent.pointerId !== pointerId) return;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
      if (!state.isDragging) return;
      const { target, blocks, snapshot } = state;
      if (target) {
        triggerHaptic(target.kind === DropKind.Trash ? "warning" : "light");
        setWorkspace((current) => applyDrop(current, target, blocks));
      } else if (!isFromPalette) setWorkspace(snapshot);
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
        program: workspace.program,
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
      setWorkspace((current) => setField(current, nodeId, fieldId, value)),
    dropTarget,
    dragHeight,
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
          <div className="flex flex-wrap items-start gap-x-2 gap-y-3">
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

        <section className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center gap-2">
            <Button
              onClick={() =>
                isRunning ? runAbortController.current?.abort() : run()
              }
              className={cn(
                !isRunning && "bg-green-600 text-white hover:bg-green-700",
              )}
            >
              <Icon icon={isRunning ? SquareIcon : PlayIcon} />
              {isRunning ? "Stop" : "Run"}
            </Button>
            <Button
              variant="ghost"
              disabled={isRunning}
              onClick={() => {
                setWorkspace(makeStarterWorkspace());
                setOutput([]);
              }}
            >
              <Icon icon={Undo02Icon} />
              Reset
            </Button>
            <span className="ml-auto text-xs text-muted-foreground max-sm:hidden">
              drop blocks anywhere to park them, faded ones don't run
            </span>
          </div>
          <div
            data-canvas
            className="relative min-h-[32rem] overflow-auto rounded-2xl bg-muted/50 bg-[radial-gradient(var(--border)_1px,transparent_0)] bg-size-[20px_20px] p-4"
          >
            <HatBlock>
              <Icon icon={PlayIcon} className="size-4" />
              When Run is clicked
            </HatBlock>
            <StatementList
              listKey={ROOT_LIST}
              nodes={workspace.program}
              className="pb-24"
            />
            {/* parked stacks: half see-through, they're not part of the run */}
            {workspace.looseStacks.map((stack) => (
              <div
                key={stack.id}
                style={{ left: stack.x, top: stack.y }}
                className="absolute opacity-50 transition-opacity hover:opacity-90"
              >
                <StatementList
                  listKey={getLooseListKey(stack.id)}
                  nodes={stack.blocks}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="flex min-w-0 flex-col gap-3 self-start lg:sticky lg:top-4">
          <div className="flex min-h-28 flex-col gap-1 rounded-2xl bg-muted p-3 font-mono text-sm">
            <span className="font-sans text-xs font-medium text-muted-foreground">
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
          className="pointer-events-none fixed top-0 left-0 z-50 flex rotate-2 flex-col items-start opacity-90 drop-shadow-xl"
          style={{ translate: `${drag.x}px ${drag.y}px` }}
        >
          {drag.blocks.map((node) => (
            <BlockView key={node.id} {...{ node }} isStatic />
          ))}
        </div>
      )}
    </BlockEditorContext.Provider>
  );
}
