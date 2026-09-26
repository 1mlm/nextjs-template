import { z } from "zod";

// every env var the app reads, checked once when the server boots (and at
// build, next.config imports this) so a missing or mistyped one fails with
// its name right away instead of as a silent undefined deep in some page.
// optional ones get a default so a fresh fork builds with no .env at all.
// a NEXT_PUBLIC_ var used in the browser has to be read as
// process.env.NEXT_PUBLIC_X literally (next inlines it at build), so those
// stay out of here
const envSchema = z.object({
  // "true" turns every page into the maintenance screen, see layout.tsx
  MAINTENANCE_MODE: z.stringbool().default(false),
});

const parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success)
  throw new Error(
    `bad env vars, fix your .env:\n${z.prettifyError(parsedEnv.error)}`,
  );

export const env = parsedEnv.data;
