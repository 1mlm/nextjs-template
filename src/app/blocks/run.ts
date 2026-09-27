import {
  type BlockNode,
  type BlockValue,
  type CodeContext,
  getBlockDefinition,
  PartKind,
  type RunContext,
  ValueType,
} from "./blocks";

// a literal typed into an empty slot, read as the type the slot takes
function parseLiteral(node: BlockNode, inputId: string): BlockValue {
  const raw = node.fields[inputId] ?? "";
  const part = getBlockDefinition(node.type)
    .rows.flat()
    .find((candidate) => "id" in candidate && candidate.id === inputId);
  const accepts = part?.kind === PartKind.Input ? part.accepts : ValueType.Any;
  if (accepts === ValueType.Number) return Number(raw) || 0;
  if (accepts === ValueType.Boolean) return raw === "true";
  // an "any" slot holding "12" is the number 12, holding "hi" is text
  if (accepts === ValueType.Any && raw.trim() !== "" && !Number.isNaN(+raw))
    return Number(raw);
  return raw;
}

export class ProgramStoppedError extends Error {}

// runs the stack top to bottom, pausing `stepMs` on every statement and
// telling the editor which block is running so it can light it up
export async function runProgram({
  program,
  stepMs,
  onStep,
  say,
  signal,
}: {
  program: BlockNode[];
  stepMs: number;
  onStep: (nodeId: string | undefined) => void;
  say: (text: string) => void;
  signal: AbortSignal;
}) {
  const context: RunContext = {
    variables: new Map(),
    say,
    getValue: (node, inputId) => {
      const plugged = node.inputs[inputId];
      if (!plugged) return parseLiteral(node, inputId);
      const definition = getBlockDefinition(plugged.type);
      return "evaluate" in definition
        ? definition.evaluate(plugged, context)
        : 0;
    },
    runBody: (node, bodyId) => runStatements(node.bodies[bodyId] ?? []),
  };

  async function runStatements(nodes: BlockNode[]) {
    for (const node of nodes) {
      if (signal.aborted) throw new ProgramStoppedError();
      onStep(node.id);
      await new Promise((resolve) => setTimeout(resolve, stepMs));
      // stop pressed during the pause, don't run the lit up block anyway
      if (signal.aborted) throw new ProgramStoppedError();
      const definition = getBlockDefinition(node.type);
      if ("run" in definition) await definition.run(node, context);
    }
  }

  try {
    await runStatements(program);
  } finally {
    onStep(undefined);
  }
}

const indent = (code: string) =>
  code
    .split("\n")
    .map((line) => (line ? `  ${line}` : line))
    .join("\n");

const toJsLiteral = (value: BlockValue) =>
  typeof value === "string" ? JSON.stringify(value) : String(value);

// the same tree printed as the javascript it stands for
export function programToCode(program: BlockNode[]) {
  const code: CodeContext = {
    getInputCode: (node, inputId) => {
      const plugged = node.inputs[inputId];
      if (!plugged) return toJsLiteral(parseLiteral(node, inputId));
      return getBlockDefinition(plugged.type).toCode(plugged, code);
    },
    getBodyCode: (node, bodyId) =>
      indent(
        (node.bodies[bodyId] ?? [])
          .map((child) => getBlockDefinition(child.type).toCode(child, code))
          .join("\n"),
      ),
  };
  return program
    .map((node) => getBlockDefinition(node.type).toCode(node, code))
    .join("\n");
}
