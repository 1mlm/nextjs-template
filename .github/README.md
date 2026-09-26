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

## Forking checklist

1. `src/app/_sidebar/nav.tsx`: `APP_INFO` (name + tagline, feeds the sidebar, tab title, manifest and link preview image), `NAV_ITEMS` (pages), `DEMO_USER` (swap for the real session user)
2. `src/app/layout.tsx`: `viewport.themeColor` if the brand isn't black/white
3. `src/app/_sidebar/drawAppIcon.tsx`: the app icon (install icons, apple icon, preview image all draw from it), plus `src/app/favicon.ico`
4. `next.config.ts`: delete the `noindex` header once the site should show up on google
5. delete the showcase (`src/app/showcase/`) and demo pages (`src/app/table/`) once you don't need the reference
6. the license line at the bottom of this file

## What's in it

Everything lives on `/showcase`, one card per component, so run `pnpm dev` and poke at them. `Ctrl/⌘ + K` finds any of them.

- **App shell**: collapsible squircle sidebar, phone tab bar with a drag-to-close menu drawer, command palette, page transitions (view transitions), new-version toast, maintenance screen (`MAINTENANCE_MODE=true`), installable (manifest + generated icons)
- **`CustomTable`** (`src/components/table/`): filters, sort, pagination, selection with bulk actions, editable cells, merged cells, pinned new rows, right-click row menu, xlsx/csv export, full example on `/table`
- **Inputs**: `Combobox`, `MultiCombobox`, `SuggestionInput`, `EditableText`, date / range / date-time pickers, `NumberTextInput`, `FileDropZone`, `AvatarPicker` (crop + zoom), `SearchBar` (url synced)
- **Buttons & overlays**: `ConfirmButton`, `HoldButton`, `MiniButton`, `SlidingTabs`, `ResponsivePopover` (popover on desktop, bottom sheet on phones), `LazyDialog`, `FormDialog`, `Stepper`, tooltips that open on tap
- **Display**: `ReorderList`, `MarqueeText`, `ScrollRow`, `RelativeTime` (live), `Kbd`, `UserAvatar`, skeletons, empty/error states
- **Charts** (`src/components/charts/`): line chart and sparkline stat card from [`bklit-ui`](https://ui.bklit.com/)
- **Utils** (`src/utils/`): haptics ([`web-haptics`](https://github.com/lochie/web-haptics)), synthesized sounds, confetti, clipboard, dates, colors, safe localStorage, undoable actions, shared clock (`useNow`)

## Scripts

- `pnpm dev`
- `pnpm check`: route types + typescript
- `pnpm biome` / `pnpm biome:fix`
- `pnpm verify`: all of the above plus a production build, same thing CI runs on every push

## Philosophy

Any config, generated code (shadcn, etc.) stays outside `src/`. `src/` is for application code only.

Biome > ESLint + Prettier. One tool, one config, handles linting and formatting with autofix for both.

pnpm is faster and doesn't copy packages into `node_modules`, just symlinks them.

---

© 2026 AllForOne. Source is provided for reference only. No use, hosting, or redistribution without written permission.
