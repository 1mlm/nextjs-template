import type { BlockNode, BlockType } from "./blocks";
import { createBlock } from "./tree";

// counter ids, not random ones, so the server and the browser build the
// exact same starting program and hydration doesn't trip
function makeIdGenerator(prefix: string) {
  const counter = { value: 0 };
  return () => `${prefix}-${counter.value++}`;
}

// the tip calculator from the scratch screenshot, rebuilt as blocks
export function makeStarterProgram(): BlockNode[] {
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
