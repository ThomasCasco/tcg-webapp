# Fase 0 — Cimientos (Design System + Mobile Layout + Observabilidad)

**Fecha:** 2026-04-28
**Master roadmap:** [2026-04-28-master-roadmap-design.md](./2026-04-28-master-roadmap-design.md)
**Estado:** Pendiente aprobación → writing-plans

## Goal

Dejar la app con un sistema de diseño coherente, layout mobile-first usable, primitivos UI reutilizables, y la base mínima de observabilidad/seguridad para que las fases siguientes construyan sin parchar.

## Por qué esta fase es bloqueante

Las fases 1-7 tocan UI. Sin tokens consistentes, primitivos `<Modal>`/`<Sheet>`/`<FormField>`, y un layout mobile-first decente, cada fase reinventa la rueda con clases Tailwind inline y termina pareciendo otra app. Hoy:

- No hay clase `.card`, `.btn`, `.input` ni `.chip` definidas. Solo `.surface-panel`.
- Componentes usan Tailwind inline mezclado con `surface-panel`, colores hardcoded (`text-black/55`, `bg-black/10`).
- Layout dashboard tiene barra de tabs scrolleable horizontal en mobile (no es nav real).
- Sin Sentry, sin logging estructurado, sin CSP.
- Keys de Supabase expuestas en `.env.local` comiteadas.

## Scope IN

### 1. Tokens de diseño (Tailwind v4 `@theme`)

Migrar `app/globals.css` para que todos los tokens sean accesibles vía Tailwind con utilities (`bg-surface`, `text-ink-muted`, `rounded-card`, etc.).

Tokens a definir:

**Colores (semánticos, no por hue):**
- `surface` (fondo app), `surface-elevated` (cards), `surface-overlay` (modales)
- `ink` (texto principal), `ink-muted` (secundario), `ink-subtle` (hint), `ink-inverse` (sobre fondos oscuros)
- `border-default`, `border-strong`, `border-subtle`
- `accent` (primario, ya existe verde), `accent-strong`, `accent-soft` (fondo suave)
- `success`, `warning`, `danger`, `info` (cada uno con `-strong` y `-soft`)

**Tipografía (clases utility):**
- `text-display-lg`, `text-display-md` (Bebas Neue, hero)
- `text-h1`, `text-h2`, `text-h3`, `text-h4` (Manrope bold)
- `text-body-lg`, `text-body`, `text-body-sm`, `text-caption`
- `text-overline` (uppercase tracking-wide)

**Spacing/Radius/Shadow:**
- Spacing: 4/8/12/16/20/24/32/48/64 (ya provisto por Tailwind, pero documentado).
- Radius: `rounded-input` (8px), `rounded-card` (16px), `rounded-pill` (9999px), `rounded-modal` (20px).
- Shadow: `shadow-card-sm`, `shadow-card`, `shadow-card-lg`, `shadow-overlay` (modal).

**Z-index:** crear escala `z-base`, `z-sticky`, `z-drawer`, `z-modal`, `z-toast`.

**Borrar:** `.surface-panel`, `.grid-overlay`. Los reemplaza el componente `<Card>`.

### 2. Primitivos UI (en `components/ui/`)

Crear los siguientes componentes. Cada uno es server-component-friendly cuando puede; si necesita interactividad, marca `"use client"`.

**`<Button>`** (`components/ui/button.tsx`)
- Variants: `primary` | `secondary` | `ghost` | `danger` | `link`
- Sizes: `sm` | `md` | `lg`
- Props: `loading`, `leftIcon`, `rightIcon`, `fullWidth`
- Min touch target 44px en mobile (lg height = 48px, md = 44px, sm = 36px solo desktop)
- Estado disabled visible

**`<Card>`** (`components/ui/card.tsx`)
- Variants: `default` | `interactive` (hover) | `muted` | `outlined`
- Sub-componentes: `Card.Header`, `Card.Body`, `Card.Footer`
- Reemplaza todos los usos de `surface-panel` en el codebase.

**`<FormField>`** (`components/ui/form-field.tsx`)
- Props: `label`, `hint`, `error`, `required`, `htmlFor`
- Wrappea `<input>`, `<textarea>`, `<select>`. La forma:
  ```
  <FormField label="..." error={...}>
    <Input ... />
  </FormField>
  ```
- También: `<Input>`, `<Textarea>`, `<Select>` (siblings con estilos consistentes).

**`<Modal>`** (`components/ui/modal.tsx`)
- Wrapper de `@radix-ui/react-dialog`.
- Mobile: full-screen sheet desde abajo.
- Desktop: centered modal con backdrop.
- Sub: `Modal.Header`, `Modal.Body`, `Modal.Footer`, `Modal.Close`.

**`<Sheet>`** (`components/ui/sheet.tsx`)
- Drawer lateral. Variants: `right` (mobile menu) | `bottom` (filtros mobile).
- Wrapper de `@radix-ui/react-dialog` con animación de slide.

**`<Toast>` + `useToast()`** (`components/ui/toast.tsx`)
- Usar `sonner` (más simple que radix-toast).
- Variants: `success` | `error` | `info` | `warning`.
- Hook: `toast.success("Pago verificado")`.

**`<Skeleton>`** (`components/ui/skeleton.tsx`)
- Animación shimmer.
- Variants: `text` | `card` | `avatar` | `image`.

**`<Chip>`** (`components/ui/chip.tsx`)
- Para tags y badges. Variants: `default` | `success` | `warning` | `danger` | `info` | `accent`.
- Sizes: `sm` | `md`.
- Opcional: `onRemove` para chips removibles (filtros activos).

**`<Avatar>`** (`components/ui/avatar.tsx`)
- Sizes: `sm` (24px) | `md` (32px) | `lg` (48px).
- Fallback con iniciales del username.

**`<EmptyState>`** (`components/ui/empty-state.tsx`)
- Props: `icon` (lucide), `title`, `description`, `action`.
- Para listas vacías (sin transacciones, sin watchlist, etc.).

**`<Spinner>` + `<LoadingOverlay>`** (`components/ui/loading.tsx`)

**Iconos:** `lucide-react`. Crear `components/ui/icon.tsx` que re-exporte los íconos usados (para tree-shaking explícito y consistencia de tamaños).

**Borrar todos los emojis** (📇🛒🏷️🔄⚖️🔔) y reemplazar por íconos lucide:
- 📇 → `<Layers>`
- 🛒 → `<ShoppingBag>`
- 🏷️ → `<Tag>`
- 🔄 → `<ArrowLeftRight>`
- ⚖️ → `<Scale>`
- 🔔 → `<Bell>`

### 3. Layout mobile-first

**Layout dashboard** (`app/(dashboard)/layout.tsx`):

Hoy: sidebar desktop + tab bar scrolleable en mobile. Reemplazar por:

- **Mobile (< md):**
  - Header sticky arriba: back button (si no es root), título de página, ícono de notificaciones (bell con badge).
  - Bottom nav fija con 5 items + íconos lucide: Mercado / Inventario / Mis Ventas / Mis Compras / Cuenta.
  - Menú hamburguesa solo si hay items secundarios (alertas, drops, settings) → abre `<Sheet>` lateral.
  - Contenido con `pb-20` para no taparlo con la bottom nav.

- **Desktop (≥ md):**
  - Sidebar fija (240px) a la izquierda con logo + nav vertical + perfil abajo.
  - Header simple arriba con título + acciones contextuales.
  - Sin bottom nav.

Componentes nuevos:
- `components/layout/bottom-nav.tsx` (mobile)
- `components/layout/dashboard-sidebar.tsx` (desktop)
- `components/layout/page-header.tsx` (mobile + desktop, con `title`, `backHref`, `actions`)
- `components/layout/dashboard-shell.tsx` (compone los anteriores según breakpoint)

**Layout público** (`app/(public)/layout.tsx`):
- Header sticky simple: logo + buscador + login button.
- Footer minimal con links a `/terms`, `/about`, etc.
- Sin bottom nav (público anónimo no necesita).

**Viewport meta:** verificar en `app/layout.tsx` que existe `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />`. Next 16 lo agrega por default pero confirmar.

**Safe area insets:** bottom nav debe usar `pb-[env(safe-area-inset-bottom)]` para iPhones.

### 4. Observabilidad

**Sentry** (`@sentry/nextjs`):
- Init en `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`.
- DSN desde env: `SENTRY_DSN` y `NEXT_PUBLIC_SENTRY_DSN`.
- `tracesSampleRate: 0.1` en prod, `1.0` en dev.
- `instrumentation.ts` en root.
- Source maps upload en build (con `SENTRY_AUTH_TOKEN`).

**Structured logging** (`lib/server/logger.ts`):
- Función `logger.info(message, context)`, `.warn`, `.error`.
- Output: JSON line con `timestamp`, `level`, `message`, `requestId`, `userId` (si hay), `...context`.
- En dev: pretty-print con colores. En prod: JSON puro (Vercel los parsea).
- `requestId` se genera en middleware (`middleware.ts`) con `crypto.randomUUID()` y se propaga vía header `x-request-id`.
- Reemplazar todos los `console.log` y `console.error` del codebase server-side.

### 5. Seguridad mínima

**Rotar keys de Supabase:**
- Documentar en `docs/runbook/rotate-supabase-keys.md`.
- Borrar `.env.local` del git history (`git filter-branch` o BFG).
- Confirmar `.env.local` en `.gitignore` (ya está).
- Generar nuevas keys en Supabase dashboard.
- Actualizar Vercel env vars.

**CSP header** (`next.config.ts`):
```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://www.mercadopago.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://*.supabase.co https://images.pokemontcg.io https://assets.tcgdex.net;
  connect-src 'self' https://*.supabase.co https://api.mercadopago.com;
  frame-src https://www.mercadopago.com.ar;
  font-src 'self' https://fonts.gstatic.com;
```

**Rate limiting en endpoints públicos:**
- `/api/catalog/*`: 60 req/min/IP
- `/api/listings` (GET): 60 req/min/IP

Reusar el rate limiter existente.

**Webhook secret cambiado:**
- Generar nuevo `PAYMENT_WEBHOOK_SECRET` con `openssl rand -hex 32`.
- Actualizar en Vercel.

### 6. Dependencias nuevas a instalar

```
npm i @sentry/nextjs lucide-react sonner @radix-ui/react-dialog @radix-ui/react-slot react-hook-form zod clsx class-variance-authority
```

- `clsx` + `class-variance-authority`: para variants de componentes.
- `react-hook-form` + `zod`: para validación de forms (lo van a usar todas las fases).

## Scope OUT

- No tocamos lógica de negocio (pagos, listings, transacciones siguen como están).
- No agregamos pantallas nuevas. Solo reemplazamos presentación.
- No migramos la totalidad de componentes existentes a los primitivos en esta fase. Lo crítico (login, register, market card, dashboard) sí. El resto se migra progresivamente en sus fases respectivas.

## Plan de migración de componentes existentes (en esta fase)

Migrar a los primitivos nuevos:
- `app/layout.tsx` → usar `<DashboardShell>`
- `app/(dashboard)/layout.tsx` → bottom nav + sidebar
- `components/login-form.tsx` → `<FormField>` + `<Button>`
- `components/register-form.tsx` → `<FormField>` + `<Button>`
- `components/market-listing-card.tsx` → `<Card>` + tokens
- `components/notifications-bell.tsx` → `<Button variant="ghost">` + badge

El resto (inventory, listings, transactions, alerts, disputes) **NO** se migran en Fase 0 — se migran cuando la fase respectiva los toque (Fase 2, 3, 4). Esto evita bloquearse.

## Acceptance criteria

1. **Visual**: Lighthouse mobile (Performance + Accessibility + Best Practices) > 85 en `/`, `/login`, `/market`, `/inventory`.
2. **Tokens**: ningún componente nuevo o tocado usa colores hardcoded (`text-black/55`, `bg-white/75`). Todos usan tokens.
3. **Mobile nav**: en 375px, los 5 items de bottom nav son tappeables (44x44 mínimo). Header sticky no se solapa con contenido.
4. **Primitivos**: existen todos los componentes listados, con stories/ejemplos en `app/(dev)/ui-kit/page.tsx` (página interna para QA visual).
5. **Sentry**: error de prueba lanzado desde cliente y servidor llega al dashboard.
6. **Logger**: cualquier API route emite logs JSON con `requestId`. `console.log` no aparece en código server.
7. **CSP**: response headers incluyen `Content-Security-Policy` válido. Sin errores en console del navegador.
8. **Keys rotadas**: `.env.local` ya no tiene secrets (o está en `.gitignore` y borrado del history). Nuevas keys en Vercel.
9. **Tests**: vitest pasa. No hay regresión en flujos existentes (smoke manual).
10. **Build**: `npm run build` sin warnings de bundle size > 300KB en chunks principales.

## Estructura de archivos resultante

```
app/
  globals.css                 # tokens via @theme
  layout.tsx                  # root layout con metadata + viewport
  (dashboard)/
    layout.tsx                # usa DashboardShell
  (public)/
    layout.tsx                # header público + footer
  (dev)/
    ui-kit/page.tsx           # showcase de primitivos (no en prod)

components/
  ui/                         # primitivos
    button.tsx
    card.tsx
    chip.tsx
    avatar.tsx
    form-field.tsx
    input.tsx
    textarea.tsx
    select.tsx
    modal.tsx
    sheet.tsx
    toast.tsx                 # exporta Toaster + useToast
    skeleton.tsx
    spinner.tsx
    empty-state.tsx
    icon.tsx
  layout/
    bottom-nav.tsx
    dashboard-sidebar.tsx
    dashboard-shell.tsx
    page-header.tsx
    public-header.tsx
    public-footer.tsx

lib/
  server/
    logger.ts                 # structured logger
  ui/
    cn.ts                     # clsx + tailwind-merge helper

middleware.ts                 # request-id

sentry.client.config.ts
sentry.server.config.ts
sentry.edge.config.ts
instrumentation.ts

next.config.ts                # CSP headers

docs/
  runbook/
    rotate-supabase-keys.md
```

## Riesgos y mitigaciones

- **Riesgo:** romper UI existente al borrar `.surface-panel`. **Mitigación:** primero crear `<Card>`, migrar uso a uso, luego borrar la clase.
- **Riesgo:** Sentry costos en plan free. **Mitigación:** sample rate 10%, ignore noisy errors, configurar quota alert.
- **Riesgo:** CSP rompe MP iframe en checkout (Fase 1). **Mitigación:** dominios MP ya incluidos en `frame-src`. Probar en Fase 1.
- **Riesgo:** rotación de keys rompe sesiones. **Mitigación:** rotar fuera de horario pico, comunicar logout forzado en banner.

## Estimación

- Tokens + Tailwind config: 0.5 día
- Primitivos UI (10 componentes): 2 días
- Layout mobile-first: 1 día
- Migración de componentes críticos (login, register, market, dashboard layout): 1 día
- Sentry + logger + middleware: 0.5 día
- CSP + rotación keys + runbook: 0.5 día
- QA + Lighthouse + ajustes: 0.5 día

**Total: ~6 días de trabajo enfocado.** Single-threaded — esta fase no se paraleliza.

## Próximo paso después de aprobar

1. Generar plan de implementación con `superpowers:writing-plans`.
2. Ejecutar plan con `superpowers:executing-plans` (sin subagentes — fase secuencial).
3. Mientras tanto, escribir spec de Fase 1 (MP automático).
