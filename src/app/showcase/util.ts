// fake latency so the demos actually show their pending states
export const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
