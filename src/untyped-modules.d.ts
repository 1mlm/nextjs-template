// liquid-gl ships plain js with no types, just the bits WebGLGlass calls
declare module "liquid-gl" {
  const liquidGL: (
    options: Record<string, unknown>,
  ) => { destroy(): void } | undefined;
  export default liquidGL;
}
