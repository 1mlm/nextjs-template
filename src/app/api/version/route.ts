// prerendered once per build, so every server of one deployment answers the
// same thing and a new deploy answers something else. NewVersionToast polls it
export const dynamic = "force-static";

const BUILT_AT = String(Date.now());

export const GET = () => Response.json({ version: BUILT_AT });
