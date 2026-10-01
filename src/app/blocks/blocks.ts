import {
  BubbleChatIcon,
  CodeIcon,
  DiceIcon,
  EqualSignIcon,
  GitBranchIcon,
  RepeatIcon,
  TextIcon,
  VariableIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { APP_ICONS } from "@/utils/icons";

// the ONE place a block is defined: how it looks (rows of parts), what it
// plugs into (output type), what it does (run/evaluate) and the js it stands
// for (toCode). the palette, the canvas, drag and drop rules, the runner and
// the code preview all read from here, a new block is a new entry and nothing else

export enum ValueType {
  Number = "number",
  Text = "text",
  Boolean = "boolean",
  // a variable can hold anything, so it fits in any slot
  Any = "any",
}

export enum BlockCategory {
  Variables = "variables",
  Control = "control",
  Operators = "operators",
  Looks = "looks",
}

// full tailwind strings so the scanner sees them. `slot` is the darker
// inset an input or a plugged expression sits in
export const CATEGORY_STYLES: Record<
  BlockCategory,
  {
    label: string;
    block: string;
    fill: string;
    slot: string;
    icon: IconSvgElement;
  }
> = {
  [BlockCategory.Variables]: {
    label: "Variables",
    block: "bg-orange-500",
    fill: "fill-orange-500",
    slot: "bg-orange-700",
    icon: VariableIcon,
  },
  [BlockCategory.Control]: {
    label: "Control",
    block: "bg-blue-500",
    fill: "fill-blue-500",
    slot: "bg-blue-700",
    icon: GitBranchIcon,
  },
  [BlockCategory.Operators]: {
    label: "Operators",
    block: "bg-green-600",
    fill: "fill-green-600",
    slot: "bg-green-800",
    icon: APP_ICONS.add,
  },
  [BlockCategory.Looks]: {
    label: "Looks",
    block: "bg-violet-500",
    fill: "fill-violet-500",
    slot: "bg-violet-700",
    icon: BubbleChatIcon,
  },
};

export enum PartKind {
  Text = "text",
  // an expression slot, holds a typed literal until a block is dropped in
  Input = "input",
  Variable = "variable",
  Option = "option",
  // a nested list of statements (the inside of repeat / if)
  Body = "body",
}

export type BlockPart =
  | { kind: PartKind.Text; text: string }
  | {
      kind: PartKind.Input;
      id: string;
      accepts: ValueType;
      defaultValue: string;
    }
  | { kind: PartKind.Variable; id: string }
  | { kind: PartKind.Option; id: string; options: string[] }
  | { kind: PartKind.Body; id: string };

export type BlockNode = {
  id: string;
  type: BlockType;
  // literals typed into empty slots, picked variables and options
  fields: Record<string, string>;
  inputs: Record<string, BlockNode | undefined>;
  bodies: Record<string, BlockNode[]>;
};

export type BlockValue = number | string | boolean;

export type RunContext = {
  getValue: (node: BlockNode, inputId: string) => BlockValue;
  runBody: (node: BlockNode, bodyId: string) => Promise<void>;
  variables: Map<string, BlockValue>;
  say: (text: string) => void;
};

export type CodeContext = {
  getInputCode: (node: BlockNode, inputId: string) => string;
  getBodyCode: (node: BlockNode, bodyId: string) => string;
};

type BlockDefinition = {
  category: BlockCategory;
  icon: IconSvgElement;
  rows: BlockPart[][];
  toCode: (node: BlockNode, code: CodeContext) => string;
} & (
  | {
      // statements stack and run one after the other
      output?: never;
      run: (node: BlockNode, context: RunContext) => Promise<void>;
    }
  | {
      // expressions are round and only plug into a slot that takes their type
      output: ValueType;
      evaluate: (node: BlockNode, context: RunContext) => BlockValue;
    }
);

export const VARIABLE_NAMES = ["bill", "tip", "people", "total", "i"];

// loops stop here so a `repeat 1e9` can't freeze the tab
export const MAX_LOOP_ITERATIONS = 200;

const toNumber = (value: BlockValue) => Number(value) || 0;

// one row per operator: what it does and how it's written in js
const MATH_OPERATORS: Record<
  string,
  { apply: (a: number, b: number) => number; js: string }
> = {
  "+": { apply: (a, b) => a + b, js: "+" },
  "-": { apply: (a, b) => a - b, js: "-" },
  "×": { apply: (a, b) => a * b, js: "*" },
  "÷": { apply: (a, b) => (b === 0 ? 0 : a / b), js: "/" },
};

const COMPARISONS: Record<
  string,
  { apply: (a: BlockValue, b: BlockValue) => boolean; js: string }
> = {
  ">": { apply: (a, b) => toNumber(a) > toNumber(b), js: ">" },
  "<": { apply: (a, b) => toNumber(a) < toNumber(b), js: "<" },
  "=": { apply: (a, b) => String(a) === String(b), js: "===" },
};

// a node always holds one of the keys above, the fallback only calms the types
const getMathOperator = (node: BlockNode) =>
  MATH_OPERATORS[node.fields.operator ?? ""] ?? {
    apply: (a: number, b: number) => a + b,
    js: "+",
  };
const getComparison = (node: BlockNode) =>
  COMPARISONS[node.fields.operator ?? ""] ?? {
    apply: (a: BlockValue, b: BlockValue) => a === b,
    js: "===",
  };

const formatForSay = (value: BlockValue) =>
  typeof value === "number"
    ? String(Math.round(value * 100) / 100)
    : String(value);

export const BLOCK_DEFINITIONS = {
  setVariable: {
    category: BlockCategory.Variables,
    icon: APP_ICONS.edit,
    rows: [
      [
        { kind: PartKind.Text, text: "Set" },
        { kind: PartKind.Variable, id: "variable" },
        { kind: PartKind.Text, text: "to" },
        {
          kind: PartKind.Input,
          id: "value",
          accepts: ValueType.Any,
          defaultValue: "0",
        },
      ],
    ],
    run: async (node, { getValue, variables }) => {
      variables.set(node.fields.variable ?? "", getValue(node, "value"));
    },
    toCode: (node, { getInputCode }) =>
      `${node.fields.variable} = ${getInputCode(node, "value")};`,
  },
  changeVariable: {
    category: BlockCategory.Variables,
    icon: APP_ICONS.add,
    rows: [
      [
        { kind: PartKind.Text, text: "Change" },
        { kind: PartKind.Variable, id: "variable" },
        { kind: PartKind.Text, text: "by" },
        {
          kind: PartKind.Input,
          id: "amount",
          accepts: ValueType.Number,
          defaultValue: "1",
        },
      ],
    ],
    run: async (node, { getValue, variables }) => {
      const name = node.fields.variable ?? "";
      const current = toNumber(variables.get(name) ?? 0);
      variables.set(name, current + toNumber(getValue(node, "amount")));
    },
    toCode: (node, { getInputCode }) =>
      `${node.fields.variable} += ${getInputCode(node, "amount")};`,
  },
  getVariable: {
    category: BlockCategory.Variables,
    icon: VariableIcon,
    output: ValueType.Any,
    rows: [[{ kind: PartKind.Variable, id: "variable" }]],
    evaluate: (node, { variables }) =>
      variables.get(node.fields.variable ?? "") ?? 0,
    toCode: (node) => node.fields.variable ?? "",
  },
  say: {
    category: BlockCategory.Looks,
    icon: BubbleChatIcon,
    rows: [
      [
        { kind: PartKind.Text, text: "Say" },
        {
          kind: PartKind.Input,
          id: "message",
          accepts: ValueType.Any,
          defaultValue: "Hello!",
        },
      ],
    ],
    run: async (node, { getValue, say }) => {
      say(formatForSay(getValue(node, "message")));
    },
    toCode: (node, { getInputCode }) =>
      `console.log(${getInputCode(node, "message")});`,
  },
  repeat: {
    category: BlockCategory.Control,
    icon: RepeatIcon,
    rows: [
      [
        { kind: PartKind.Text, text: "Repeat" },
        {
          kind: PartKind.Input,
          id: "times",
          accepts: ValueType.Number,
          defaultValue: "3",
        },
        { kind: PartKind.Text, text: "times" },
      ],
      [{ kind: PartKind.Body, id: "body" }],
    ],
    run: async (node, { getValue, runBody, variables }) => {
      const times = Math.min(
        toNumber(getValue(node, "times")),
        MAX_LOOP_ITERATIONS,
      );
      for (const index of Array.from({ length: times }, (_, i) => i)) {
        variables.set("i", index + 1);
        await runBody(node, "body");
      }
    },
    toCode: (node, { getInputCode, getBodyCode }) =>
      `for (let i = 1; i <= ${getInputCode(node, "times")}; i++) {\n${getBodyCode(node, "body")}\n}`,
  },
  ifElse: {
    category: BlockCategory.Control,
    icon: GitBranchIcon,
    rows: [
      [
        { kind: PartKind.Text, text: "If" },
        {
          kind: PartKind.Input,
          id: "condition",
          accepts: ValueType.Boolean,
          defaultValue: "",
        },
      ],
      [{ kind: PartKind.Body, id: "whenTrue" }],
      [{ kind: PartKind.Text, text: "Otherwise" }],
      [{ kind: PartKind.Body, id: "whenFalse" }],
    ],
    run: async (node, { getValue, runBody }) => {
      const isTrue = getValue(node, "condition") === true;
      await runBody(node, isTrue ? "whenTrue" : "whenFalse");
    },
    toCode: (node, { getInputCode, getBodyCode }) =>
      `if (${getInputCode(node, "condition")}) {\n${getBodyCode(node, "whenTrue")}\n} else {\n${getBodyCode(node, "whenFalse")}\n}`,
  },
  math: {
    category: BlockCategory.Operators,
    icon: CodeIcon,
    output: ValueType.Number,
    rows: [
      [
        {
          kind: PartKind.Input,
          id: "left",
          accepts: ValueType.Number,
          defaultValue: "1",
        },
        {
          kind: PartKind.Option,
          id: "operator",
          options: Object.keys(MATH_OPERATORS),
        },
        {
          kind: PartKind.Input,
          id: "right",
          accepts: ValueType.Number,
          defaultValue: "1",
        },
      ],
    ],
    evaluate: (node, { getValue }) =>
      getMathOperator(node).apply(
        toNumber(getValue(node, "left")),
        toNumber(getValue(node, "right")),
      ),
    toCode: (node, { getInputCode }) =>
      `(${getInputCode(node, "left")} ${getMathOperator(node).js} ${getInputCode(node, "right")})`,
  },
  compare: {
    category: BlockCategory.Operators,
    icon: EqualSignIcon,
    output: ValueType.Boolean,
    rows: [
      [
        {
          kind: PartKind.Input,
          id: "left",
          accepts: ValueType.Any,
          defaultValue: "1",
        },
        {
          kind: PartKind.Option,
          id: "operator",
          options: Object.keys(COMPARISONS),
        },
        {
          kind: PartKind.Input,
          id: "right",
          accepts: ValueType.Any,
          defaultValue: "1",
        },
      ],
    ],
    evaluate: (node, { getValue }) =>
      getComparison(node).apply(
        getValue(node, "left"),
        getValue(node, "right"),
      ),
    toCode: (node, { getInputCode }) =>
      `${getInputCode(node, "left")} ${getComparison(node).js} ${getInputCode(node, "right")}`,
  },
  join: {
    category: BlockCategory.Operators,
    icon: APP_ICONS.link,
    output: ValueType.Text,
    rows: [
      [
        { kind: PartKind.Text, text: "Join" },
        {
          kind: PartKind.Input,
          id: "left",
          accepts: ValueType.Any,
          defaultValue: "hello ",
        },
        {
          kind: PartKind.Input,
          id: "right",
          accepts: ValueType.Any,
          defaultValue: "world",
        },
      ],
    ],
    evaluate: (node, { getValue }) =>
      formatForSay(getValue(node, "left")) +
      formatForSay(getValue(node, "right")),
    toCode: (node, { getInputCode }) =>
      `${getInputCode(node, "left")} + ${getInputCode(node, "right")}`,
  },
  random: {
    category: BlockCategory.Operators,
    icon: DiceIcon,
    output: ValueType.Number,
    rows: [
      [
        { kind: PartKind.Text, text: "Random" },
        {
          kind: PartKind.Input,
          id: "min",
          accepts: ValueType.Number,
          defaultValue: "1",
        },
        { kind: PartKind.Text, text: "to" },
        {
          kind: PartKind.Input,
          id: "max",
          accepts: ValueType.Number,
          defaultValue: "6",
        },
      ],
    ],
    evaluate: (node, { getValue }) => {
      const min = toNumber(getValue(node, "min"));
      const max = toNumber(getValue(node, "max"));
      return min + Math.floor(Math.random() * (max - min + 1));
    },
    toCode: (node, { getInputCode }) =>
      `randomBetween(${getInputCode(node, "min")}, ${getInputCode(node, "max")})`,
  },
  text: {
    category: BlockCategory.Operators,
    icon: TextIcon,
    output: ValueType.Text,
    rows: [
      [
        {
          kind: PartKind.Input,
          id: "value",
          accepts: ValueType.Text,
          defaultValue: "text",
        },
      ],
    ],
    evaluate: (node, { getValue }) => getValue(node, "value"),
    toCode: (node, { getInputCode }) => getInputCode(node, "value"),
  },
} satisfies Record<string, BlockDefinition>;

export type BlockType = keyof typeof BLOCK_DEFINITIONS;

export const getBlockDefinition = (type: BlockType): BlockDefinition =>
  BLOCK_DEFINITIONS[type];

export const BLOCK_TYPES = Object.keys(BLOCK_DEFINITIONS) as BlockType[];

// a variable fits anywhere, anything fits an "any" slot, otherwise the types
// must match (so a number can't go where an if wants true/false)
export const canPlugInto = (output: ValueType, accepts: ValueType) =>
  accepts === ValueType.Any || output === ValueType.Any || output === accepts;
