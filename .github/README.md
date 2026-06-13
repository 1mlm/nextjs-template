# nextjs-template

- [`Next.js`](https://nextjs.org/) 16 with Turbopack
- [`TypeScript`](https://www.typescriptlang.org/) 5
- [`React`](https://react.dev/) 19
- [`Tailwind CSS`](https://tailwindcss.com/) 4
- [`shadcn`](https://ui.shadcn.com/) (Nova style, Neutral theme, Medium radius, [`Outfit`](https://fonts.google.com/specimen/Outfit) font)
- [`Hugeicons`](https://hugeicons.com/)
- [`Biome`](https://biomejs.dev/)
- [`pnpm`](https://pnpm.io/)

## Philosophy

Any config, generated code (shadcn, etc.) stays outside `src/`. `src/` is for application code only.

Biome > ESLint + Prettier. One tool, one config, handles linting and formatting with autofix for both.

pnpm is faster and doesn't copy packages into `node_modules`, just symlinks them.

`.vscode/settings.json` hides ugly files (`node_modules`, `.next`, `shadcn/ui`, lockfiles...) from the file explorer.

---

© 2026 AllForOne. Source is provided for reference only. No use, hosting, or redistribution without written permission.
