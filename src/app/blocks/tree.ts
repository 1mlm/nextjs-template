import {
  type BlockNode,
  type BlockType,
  getBlockDefinition,
  PartKind,
  VARIABLE_NAMES,
} from "./blocks";

// where a statement can land: the top level stack or one body of a block
export type ListKey = string;
export const ROOT_LIST: ListKey = "root";
export const getBodyListKey = (nodeId: string, bodyId: string): ListKey =>
  `${nodeId}:${bodyId}`;

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
  const bodies = Object.fromEntries(
    parts.flatMap((part) =>
      part.kind === PartKind.Body ? [[part.id, [] as BlockNode[]]] : [],
    ),
  );
  return { id: getId(), type, fields, inputs: {}, bodies };
}

// runs `update` on the node with this id wherever it's nested, returns a new
// tree (same objects everywhere else so react only redraws that branch)
function updateNodeInList(
  nodes: BlockNode[],
  nodeId: string,
  update: (node: BlockNode) => BlockNode,
): BlockNode[] {
  return nodes.map((node) => updateNode(node, nodeId, update));
}

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
      updateNodeInList(children, nodeId, update),
    ]),
  );
  return { ...node, inputs, bodies };
}

export const setField = (
  program: BlockNode[],
  nodeId: string,
  fieldId: string,
  value: string,
) =>
  updateNodeInList(program, nodeId, (node) => ({
    ...node,
    fields: { ...node.fields, [fieldId]: value },
  }));

// takes the block out from wherever it sits (a stack or a slot), with
// everything inside it
export function removeBlock(nodes: BlockNode[], nodeId: string): BlockNode[] {
  return nodes
    .filter((node) => node.id !== nodeId)
    .map((node) => ({
      ...node,
      inputs: Object.fromEntries(
        Object.entries(node.inputs).map(([inputId, child]) => [
          inputId,
          child?.id === nodeId
            ? undefined
            : child && removeBlock([child], nodeId)[0],
        ]),
      ),
      bodies: Object.fromEntries(
        Object.entries(node.bodies).map(([bodyId, children]) => [
          bodyId,
          removeBlock(children, nodeId),
        ]),
      ),
    }));
}

const insertAt = <T>(items: T[], index: number, item: T) => [
  ...items.slice(0, index),
  item,
  ...items.slice(index),
];

export function insertStatement(
  program: BlockNode[],
  listKey: ListKey,
  index: number,
  block: BlockNode,
): BlockNode[] {
  if (listKey === ROOT_LIST) return insertAt(program, index, block);
  const [parentId = "", bodyId = ""] = listKey.split(":");
  return updateNodeInList(program, parentId, (parent) => ({
    ...parent,
    bodies: {
      ...parent.bodies,
      [bodyId]: insertAt(parent.bodies[bodyId] ?? [], index, block),
    },
  }));
}

export const plugExpression = (
  program: BlockNode[],
  parentId: string,
  inputId: string,
  block: BlockNode,
) =>
  updateNodeInList(program, parentId, (parent) => ({
    ...parent,
    inputs: { ...parent.inputs, [inputId]: block },
  }));
