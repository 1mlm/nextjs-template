# nextjs-template

- [`Next.js`](https://nextjs.org/) 16 with Turbopack
- [`TypeScript`](https://www.typescriptlang.org/) 5
- [`React`](https://react.dev/) 19
- [`Tailwind CSS`](https://tailwindcss.com/) 4
- [`shadcn`](https://ui.shadcn.com/) (Nova style, Neutral theme, Medium radius, [`Outfit`](https://fonts.google.com/specimen/Outfit) font)
- [`Hugeicons`](https://hugeicons.com/)
- [`nuqs`](https://nuqs.dev/) (URL-synced state, `q` as the default search param)
- [`Biome`](https://biomejs.dev/)
- [`pnpm`](https://pnpm.io/)

## Included components

Everything is on the home page (`src/app/page.tsx`, demos in `src/app/_showcase/`), one card per component, so run `pnpm dev` and poke at them.

- `CustomTable` (`src/components/table/`): filterable, sortable, paginated data table with xlsx/csv export ([`exceljs`](https://github.com/exceljs/exceljs)), columns typed with the `ColumnType` enum in `columns.ts`, full example in `src/app/table/page.tsx`
- `src/components/charts/`: line charts and stat cards from [`bklit-ui`](https://ui.bklit.com/) (shadcn registry, don't hand-edit), see `src/app/stats/page.tsx`
- `src/components/form/`: `FormDialog` + `useFormDialogAction` + `SubmitButton` + `FormError`
- `ResponsivePopover` (popover on desktop, bottom sheet on phones), `Tooltip` (also opens on tap on touch devices)
- UI atoms in `src/components/`: `Chip`, `ConfirmButton`, `DialogIconBadge`, `EmptyState`, `ErrorState`, `ErrorTooltip`, `FieldLabel`, `FileDropZone`, `Icon`, `LabelTag`, `MiniButton`, `NumberTextInput`, `PageSkeleton`, `RelativeTime`, `SearchBar`
- `src/utils/`: clipboard, color hashing, confetti, date formatting, haptics ([`web-haptics`](https://github.com/lochie/web-haptics)), synthesized sounds, safe localStorage, undoable actions (sonner toast with undo)
- `src/app/error.tsx` and `src/app/not-found.tsx`

## Philosophy

Any config, generated code (shadcn, etc.) stays outside `src/`. `src/` is for application code only.

Biome > ESLint + Prettier. One tool, one config, handles linting and formatting with autofix for both.

pnpm is faster and doesn't copy packages into `node_modules`, just symlinks them.

---

© 2026 AllForOne. Source is provided for reference only. No use, hosting, or redistribution without written permission.
