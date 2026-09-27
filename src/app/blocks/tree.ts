import {
  type BlockNode,
  type BlockType,
  getBlockDefinition,
  PartKind,
  VARIABLE_NAMES,
} from "./blocks";

// blocks lying around the canvas that aren't under the Run hat. they're
// dimmed and never run, a parking spot while you build
export type LooseStack = {
  id: string;
  x: number;
  y: number;
  blocks: BlockNode[];
};

export type Workspace = { program: BlockNode[]; looseStacks: LooseStack[] };

// where a statement can land: the main stack, a body of a block, or a loose stack
export type ListKey = string;
export const ROOT_LIST: ListKey = "root";
export const getBodyListKey = (nodeId: string, bodyId: string): ListKey =>
  `${nodeId}:${bodyId}`;
export const getLooseListKey = (stackId: string): ListKey => `loose:${stackId}`;

// a fresh block with every slot, variable and option at its default
export function createBlock(type: BlockType, getId: () => string): BlockNode {
  const parts = getBlockDefinition(type).rows.flat();
  const fields = Object.fromEntries(
    parts.flatMap((part) => {
      if (part.kind === PartKind.Input) return [[part.id, part.defaultValue]];
      if (part.kind === PartKind.Variable)
        return [[part.id, VARIABLE_NAMES[0] ?? ""]];
      if (part.kind === PartKind.Option)
        return [[part.id, part.options[0] ?? ""]];
      return [];
    }),
  );
  const bodies: Record<string, BlockNode[]> = Object.fromEntries(
    parts.flatMap((part) =>
      part.kind === PartKind.Body ? [[part.id, []]] : [],
    ),
  );
  return { id: getId(), type, fields, inputs: {}, bodies };
}

// every top level list of the workspace goes through `update`, then loose
// stacks that ended up empty are dropped
function updateAllStacks(
  workspace: Workspace,
  update: (blocks: BlockNode[]) => BlockNode[],
): Workspace {
  return {
    program: update(workspace.program),
    looseStacks: workspace.looseStacks
      .map((stack) => ({ ...stack, blocks: update(stack.blocks) }))
      .filter((stack) => stack.blocks.length > 0),
  };
}

// runs `update` on the node with this id wherever it's nested, returns a new
// tree (same objects everywhere else so react only redraws that branch)
function updateNode(
  node: BlockNode,
  nodeId: string,
  update: (node: BlockNode) => BlockNode,
): BlockNode {
  if (node.id === nodeId) return update(node);
  const inputs = Object.fromEntries(
    Object.entries(node.inputs).map(([inputId, child]) => [
      inputId,
      child && updateNode(child, nodeId, update),
    ]),
  );
  const bodies = Object.fromEntries(
    Object.entries(node.bodies).map(([bodyId, children]) => [
      bodyId,
      children.map((child) => updateNode(child, nodeId, update)),
    ]),
  );
  return { ...node, inputs, bodies };
}

const updateNodeEverywhere = (
  workspace: Workspace,
  nodeId: string,
  update: (node: BlockNode) => BlockNode,
) =>
  updateAllStacks(workspace, (blocks) =>
    blocks.map((block) => updateNode(block, nodeId, update)),
  );

export const setField = (
  workspace: Workspace,
  nodeId: string,
  fieldId: string,
  value: string,
) =>
  updateNodeEverywhere(workspace, nodeId, (node) => ({
    ...node,
    fields: { ...node.fields, [fieldId]: value },
  }));

// cuts the block and everything under it out of whatever list it's in (like
// scratch, you drag the block and the rest of its stack comes along)
function takeStackFrom(
  nodes: BlockNode[],
  nodeId: string,
): { nodes: BlockNode[]; taken?: BlockNode[] } {
  const index = nodes.findIndex((node) => node.id === nodeId);
  if (index !== -1)
    return { nodes: nodes.slice(0, index), taken: nodes.slice(index) };
  const result: { taken?: BlockNode[] } = {};
  const nextNodes = nodes.map((node) => {
    if (result.taken) return node;
    const bodies = Object.fromEntries(
      Object.entries(node.bodies).map(([bodyId, children]) => {
        if (result.taken) return [bodyId, children];
        const found = takeStackFrom(children, nodeId);
        result.taken = found.taken;
        return [bodyId, found.nodes];
      }),
    );
    return result.taken ? { ...node, bodies } : node;
  });
  return { nodes: nextNodes, taken: result.taken };
}

// an expression plugged into a slot comes out alone, the slot goes back to
// its typed literal
function unplugFrom(nodes: BlockNode[], nodeId: string): BlockNode[] {
  return nodes.map((node) => ({
    ...node,
    inputs: Object.fromEntries(
      Object.entries(node.inputs).map(([inputId, child]) => [
        inputId,
        child?.id === nodeId
          ? undefined
          : child && unplugFrom([child], nodeId)[0],
      ]),
    ),
    bodies: Object.fromEntries(
      Object.entries(node.bodies).map(([bodyId, children]) => [
        bodyId,
        unplugFrom(children, nodeId),
      ]),
    ),
  }));
}

// picks up a block for dragging: returns the workspace without it and what
// came with it (its stack below it, or just itself out of a slot)
export function pickUp(
  workspace: Workspace,
  node: BlockNode,
): { workspace: Workspace; taken: BlockNode[] } {
  const takenStacks: BlockNode[][] = [];
  const withoutStack = updateAllStacks(workspace, (blocks) => {
    const found = takeStackFrom(blocks, node.id);
    if (found.taken) takenStacks.push(found.taken);
    return found.nodes;
  });
  const taken = takenStacks[0];
  if (taken) return { workspace: withoutStack, taken };
  return {
    workspace: updateAllStacks(workspace, (blocks) =>
      unplugFrom(blocks, node.id),
    ),
    taken: [node],
  };
}

const insertAt = <T>(items: T[], index: number, inserted: T[]) => [
  ...items.slice(0, index),
  ...inserted,
  ...items.slice(index),
];

export function insertStack(
  workspace: Workspace,
  listKey: ListKey,
  index: number,
  blocks: BlockNode[],
): Workspace {
  if (listKey === ROOT_LIST)
    return {
      ...workspace,
      program: insertAt(workspace.program, index, blocks),
    };
  if (listKey.startsWith("loose:")) {
    const stackId = listKey.slice("loose:".length);
    return {
      ...workspace,
      looseStacks: workspace.looseStacks.map((stack) =>
        stack.id === stackId
          ? { ...stack, blocks: insertAt(stack.blocks, index, blocks) }
          : stack,
      ),
    };
  }
  const [parentId = "", bodyId = ""] = listKey.split(":");
  return updateNodeEverywhere(workspace, parentId, (parent) => ({
    ...parent,
    bodies: {
      ...parent.bodies,
      [bodyId]: insertAt(parent.bodies[bodyId] ?? [], index, blocks),
    },
  }));
}

export const plugExpression = (
  workspace: Workspace,
  parentId: string,
  inputId: string,
  block: BlockNode,
) =>
  updateNodeEverywhere(workspace, parentId, (parent) => ({
    ...parent,
    inputs: { ...parent.inputs, [inputId]: block },
  }));

export const addLooseStack = (
  workspace: Workspace,
  stack: LooseStack,
): Workspace => ({
  ...workspace,
  looseStacks: [...workspace.looseStacks, stack],
});
