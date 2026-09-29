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
2. `src/env.ts`: add every env var the app reads to the zod schema (build fails loudly on a missing one)
3. `src/app/layout.tsx`: `viewport.themeColor` if the brand isn't black/white
4. `src/app/_sidebar/drawAppIcon.tsx`: the app icon (install icons, apple icon, preview image all draw from it), plus `src/app/favicon.ico`
5. `next.config.ts`: delete the `noindex` header once the site should show up on google
6. delete the showcase (`src/app/showcase/`) and demo pages (`src/app/table/`, `src/app/blocks/`) once you don't need the reference
7. the license line at the bottom of this file

## What's in it

Everything lives on `/showcase`, one card per component, so run `pnpm dev` and poke at them. `Ctrl/⌘ + K` finds any of them.

- **App shell**: collapsible squircle sidebar with a profile footer, phone tab bar with a drag-to-close menu drawer, command palette, page transitions (view transitions), maintenance screen (`MAINTENANCE_MODE=true`), installable (manifest + generated icons)
- **`CustomTable`** (`src/components/table/`): filters, sort, pagination, selection with bulk actions, editable cells, merged cells (sticky group label), cells that expand over themselves when clipped, long text columns, icon-only headers, pinned new rows, right-click row menu, xlsx/csv export, full example on `/table`
- **Blocks editor** (`src/app/blocks/`): scratch-style drag and drop programming: blocks with real notches and bumps that lock together, stacks snap by their corner and drag the blocks below along, parked stacks sit faded on the canvas. every block is defined once in `blocks.ts` (looks, plug rules, run, js output), runs step by step with the running block lit up
- **Inputs**: item-aligned `Select`, `Combobox`, `MultiCombobox`, `SuggestionInput`, `EditableText`, date / range / date-time pickers, `NumberTextInput`, `FileDropZone`, `AvatarPicker` (crop + zoom), `SearchBar` (url synced)
- **Buttons & overlays**: `ConfirmButton`, `HoldButton`, `MiniButton`, `SlidingTabs`, `ResponsivePopover` (popover on desktop, bottom sheet on phones), `LazyDialog`, `FormDialog` (the submit shakes when it can't go through), `Stepper`, tooltips that open on tap
- **Look**: `SquircleFuserContainer` (pills fused into a frame's edge), `FluentEmoji` (svg only, downloads when scrolled near, dances on hover, tool emoji redrawn in any tailwind color), Inter / Montserrat / Outfit / Space Grotesk preview
- **Display**: `ReorderList`, `ListRow` + skeletons that swap without moving a pixel, `MarqueeText`, `ScrollRow`, `RelativeTime` (live), `Kbd`, `UserAvatar`, skeletons, empty/error states
- **Charts** (`src/components/charts/`): line chart with a y axis per series (`YAxis`), sparkline stat card, donut `PieChart`, based on [`bklit-ui`](https://ui.bklit.com/)
- **Learning & games** (`src/components/learn/`): `LessonPath` (winding road of lessons), `QuizQuestion` (check bar slides up green or red), `Flashcard` (3D flip, swipe to grade), `WordBank` (tapped words fly into blanks), `CoordinatePlane` (drag points that snap to whole numbers), `StreakFlame`, `XpBar`, `Hearts`. plus `VoiceButton` (rings ripple with your real voice) and `Die3D` (a three.js die with a transparent canvas that sits inside the text, three only downloads when it scrolls near)
- **Device & browser apis** (`src/components/device/`): `FocusTimer` (wake lock, pops out into a floating always-on-top window), `EyeDropperButton`, `TiltCard` (cursor and gyroscope), `PianoKeys` (web audio), `ShareButton`. every one says so when the browser can't do it
- **Utils** (`src/utils/`): haptics ([`@haptics/core`](https://haptics-web.vercel.app/), works on ios 26.5+ through real taps), `shakeElement`, synthesized sounds, confetti, clipboard, dates, colors, safe localStorage, undoable actions, shared clock (`useNow`)

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
