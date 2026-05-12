# Glass Dark UI Migration — Design Spec

**Date:** 2026-05-11
**Scope:** Full visual refactor of the TCG Marketplace web app to the "Glass Dark" design system shipped in `C:\tcg-webapp\MIGRACION_ESTILOS`.

## Goal

Replace the current light-theme Tailwind v4 design system with the dark, glass-morphism system from the migration folder, **without** changing routes, server actions, data shapes, or backend behavior.

## Non-goals

- Adding new routes (`/publish` wizard, `/chat/[id]`, `/orders/[id]`, `/trades/[id]`). These imply product feature changes; handled in a follow-up.
- Re-architecting forms or data fetching.
- Switching from Tailwind to plain CSS. Tailwind v4 stays; new design tokens live alongside it.
- framer-motion (the source uses raw CSS animations; we keep that).

## Constraints

- Source prototypes are plain JSX served via Babel standalone, using `window.UI` / `window.DATA` globals. We must convert to real TSX modules with proper imports and types.
- All existing pages already render server data through forms + server actions; we cannot break their props or HTML structure beyond CSS class swaps.
- Next.js 16 with Tailwind v4. Per AGENTS.md, this is a non-standard Next; we treat its conventions as authoritative.

## Architecture

### Tokens (Phase 1)

`app/globals.css` is rewritten:
- Adds CSS variables block for the glass system (`--accent`, `--accent-hi`, `--accent-glow`, `--bg-*`, `--ink*`, `--glass-*`, `--hairline`, `--shadow-card`, `--shadow-fab`, radii, motion easing, fonts).
- Defines both `[data-theme="dark"]` (default) and `[data-theme="light"]` blocks.
- Defines keyframes: `shimmer`, `nav-pop`, `screen-in`, `slide-up`, `fade-in`, `pulse-ring`, `marquee`.
- Defines utility classes: `.glass`, `.glass-soft`, `.t-display`/`.t-h1..h3`/`.t-body`/`.t-sm`/`.t-xs`/`.t-eyebrow`/`.t-mono`/`.t-mute`/`.t-soft`, `.btn`/`.btn-primary`/`.btn-ghost`/`.btn-icon`, `.chip`/`.chip-active`/variants, `.hairline`, `.skeleton`, `.tcg-tile`/`.tcg-halo`, `.scroll-x`, layout helpers (`.row`/`.col`/`.gap-*`/`.center`/`.between`).
- Keeps the existing Tailwind v4 setup (we still `@import "tailwindcss"`), but **drops** the old `@theme` color/radius/shadow tokens and the old `@layer base` overrides (`.card`, `.chip`, `.btn-primary` light-theme variants, etc.).
- Body background uses `--page-bg`.

`app/layout.tsx`:
- Replaces `Bebas_Neue` / `Manrope` imports with `Sora` (display), `Inter` (body), `JetBrains_Mono` (mono). Variables exported as `--font-display`, `--font-body`, `--font-mono`.
- Sets `data-theme="dark"` on `<html>` (we ship dark-only for v1; light tokens stay in CSS for later toggle).
- Body class drops light-theme assumptions.

### Primitives (Phase 2)

`components/ui/`:
- `button.tsx` → glass `btn`/`btn-primary`/`btn-ghost`/`btn-icon` variants. Keeps the same export name + variants (`primary`, `secondary`, `ghost`, `icon`) so call sites compile.
- `chip.tsx` → glass chips (`active`, `soft`, `ok`/`warn`/`bad`/`info`). Same props as today.
- `card.tsx` → `GlassCard` (`soft` variant + `padded`). Replaces the bordered light card.
- `sheet.tsx` → bottom sheet with backdrop, `.slide-up` body. Keep Radix Dialog underneath for a11y/escape behavior.
- `modal.tsx` → glass modal.
- `input.tsx`, `textarea.tsx`, `select.tsx`, `form-field.tsx` → glass-soft pill inputs with eyebrow labels.
- `toast.tsx` → glass toast; we keep Sonner under the hood and just restyle.
- `skeleton.tsx` → `.skeleton` shimmer.
- `spinner.tsx` → pulse-ring spinner.
- `empty-state.tsx` → glass empty.
- `icon.tsx` → keep lucide-react. We do NOT port the custom stroke icons (lucide covers them).
- `image-uploader.tsx` → restyle camera tiles.
- `avatar.tsx` → gradient initial avatar.

New primitives:
- `count-up.tsx` (client) — animated number.
- `sparkline.tsx` (client) — SVG sparkline.
- `tcg-tile.tsx` — listing card tile (uses next/image when `imageUrl` provided, gradient `CardArt` placeholder otherwise).
- `stepper.tsx` — progress bar for multi-step flows.
- `fab.tsx` — floating action button.
- `countdown.tsx` (client) — for auctions.

### Layout (Phase 2b)

`components/layout/`:
- `bottom-nav.tsx` (mobile) — restyled glass nav with center FAB.
- `dashboard-sidebar.tsx` — glass sidebar; structure unchanged.
- `top-bar.tsx` / `public-header.tsx` — glass header.
- `dashboard-shell.tsx`, `page-header.tsx`, `public-footer.tsx`, `user-menu.tsx` — restyle.

### Screens (Phase 3)

For each existing `page.tsx`:
- Replace `bg-surface`, `border-border-default`, `text-ink-muted`, `shadow-card`, etc. with new utility/glass classes.
- Wrap card-y blocks with `<Card>` (the new GlassCard).
- Replace headings with `.t-h1`/`.t-h2` classes (we keep `<h1>` etc. tags for semantics).
- Keep all `<form>`, server-action props, and data flow untouched.

Component restyling for existing feature components (auction-listing-card, market-listing-card, listing-row, inventory-entry-card, transaction-card, transaction-chat, etc.): swap classes, no behavioral changes.

## Risk / cutover

- The Tailwind token rename is the biggest blast radius — anything still referencing `bg-surface`, `border-border-default`, `text-ink`, `shadow-card-*`, the old `--font-display` mapping will compile but render with raw fallback colors. Mitigation: do a final grep pass and replace, then run `next build` + `tsc --noEmit`.
- We do NOT remove Tailwind tokens until Phase 3 grep pass is clean; we add the new ones first so both work during migration.

## Testing

- `npm run typecheck` — zero new errors.
- `npm run lint` — no new lint errors.
- `npm run build` — succeeds.
- `npm test` — existing vitest suite still green.
- Manual smoke: navigate `/`, `/market`, `/auctions`, `/dashboard`, `/inventory`, `/login`.
