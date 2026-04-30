# Phase 0 — Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a coherent design system, mobile-first dashboard layout, reusable UI primitives, observability (Sentry + structured logging), and minimal security hardening — so subsequent phases (1-7) can build features without reinventing presentation or operating blind.

**Architecture:** Tailwind v4 `@theme` directive defines design tokens consumed by primitives in `components/ui/`. Primitives use `class-variance-authority` for variants and `clsx`+`tailwind-merge` for class composition. Overlays (Modal, Sheet) wrap `@radix-ui/react-dialog`. Toasts via `sonner`. Icons via `lucide-react`. Layout splits into mobile (bottom nav + sticky header) and desktop (sidebar) via a `DashboardShell` server component. Sentry initialized for client/server/edge. Structured logger emits JSON with request IDs from middleware.

**Tech Stack:** Next.js 16.2.4 (App Router) · React 19.2 · Tailwind v4 · Supabase · TypeScript 5 strict · Vitest + @testing-library/react · class-variance-authority · @radix-ui/react-dialog · sonner · lucide-react · @sentry/nextjs · zod · react-hook-form

---

## File Structure

```
app/
  globals.css                 # Tokens via @theme, no surface-panel
  layout.tsx                  # Root: viewport meta, fonts, Toaster mount
  (dashboard)/layout.tsx      # Uses <DashboardShell>
  (public)/layout.tsx         # PublicHeader + PublicFooter
  (dev)/ui-kit/page.tsx       # Showcase de primitivos

components/
  ui/
    button.tsx
    card.tsx
    chip.tsx
    avatar.tsx
    input.tsx
    textarea.tsx
    select.tsx
    form-field.tsx
    modal.tsx
    sheet.tsx
    toast.tsx
    skeleton.tsx
    spinner.tsx
    empty-state.tsx
    icon.tsx
  layout/
    bottom-nav.tsx
    dashboard-sidebar.tsx
    page-header.tsx
    dashboard-shell.tsx
    public-header.tsx
    public-footer.tsx

lib/
  ui/cn.ts
  server/logger.ts

middleware.ts
instrumentation.ts
sentry.client.config.ts
sentry.server.config.ts
sentry.edge.config.ts

vitest.config.ts              # jsdom env + setup file
tests/setup.ts                # @testing-library/jest-dom

docs/runbook/
  rotate-supabase-keys.md
```

Each primitive lives in its own file (one responsibility, easy to test, easy to read). Layout components live under `components/layout/` to keep `components/` cleaner. Existing feature components stay where they are; only the critical four migrate in this phase.

---

## Task 1: Install Dependencies and Configure Test Environment

**Files:**
- Modify: `package.json`
- Modify: `vitest.config.ts`
- Create: `tests/setup.ts`

- [ ] **Step 1: Install runtime dependencies**

Run:
```bash
npm i @sentry/nextjs lucide-react sonner @radix-ui/react-dialog @radix-ui/react-slot react-hook-form zod clsx class-variance-authority tailwind-merge
```

Expected: dependencies added to `package.json`.

- [ ] **Step 2: Install dev dependencies for component testing**

Run:
```bash
npm i -D @testing-library/react @testing-library/dom @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 3: Update vitest.config.ts to use jsdom and load setup file**

Replace `vitest.config.ts` with:
```ts
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 4: Create tests/setup.ts**

Create `tests/setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 5: Add typecheck script and run sanity check**

Modify `package.json` `"scripts"` to add:
```json
"typecheck": "tsc --noEmit"
```

Run:
```bash
npm run typecheck
```

Expected: passes (no preexisting errors should be introduced by deps).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts tests/setup.ts
git commit -m "chore(deps): install UI primitives, testing-library, sentry deps"
```

---

## Task 2: Define Design Tokens via Tailwind v4 @theme

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Replace globals.css with token-driven theme**

Replace `app/globals.css` with:
```css
@import "tailwindcss";

@theme {
  /* Surfaces */
  --color-surface: #f5efdf;
  --color-surface-elevated: #fffaf0;
  --color-surface-overlay: rgba(255, 250, 240, 0.98);

  /* Ink (text) */
  --color-ink: #1f1b15;
  --color-ink-muted: #5b5347;
  --color-ink-subtle: #8a8174;
  --color-ink-inverse: #fffaf0;

  /* Borders */
  --color-border-default: #d9cbb0;
  --color-border-strong: #b8a986;
  --color-border-subtle: #ece1c8;

  /* Accent */
  --color-accent: #0f7a66;
  --color-accent-strong: #0a5f50;
  --color-accent-soft: #d4ede5;

  /* Status */
  --color-success: #157a4d;
  --color-success-soft: #d3eddf;
  --color-warning: #b06d10;
  --color-warning-soft: #fbe6c4;
  --color-danger: #b3261e;
  --color-danger-soft: #f4d8d6;
  --color-info: #1d5e9c;
  --color-info-soft: #d4e3f3;

  /* Typography (Bebas + Manrope already loaded in root layout) */
  --font-display: var(--font-display);
  --font-sans: var(--font-body);

  /* Radius */
  --radius-input: 0.5rem;
  --radius-card: 1rem;
  --radius-modal: 1.25rem;
  --radius-pill: 9999px;

  /* Shadows */
  --shadow-card-sm: 0 1px 2px rgba(31, 27, 21, 0.06), 0 1px 3px rgba(31, 27, 21, 0.04);
  --shadow-card: 0 4px 12px rgba(31, 27, 21, 0.08), 0 2px 4px rgba(31, 27, 21, 0.04);
  --shadow-card-lg: 0 16px 36px rgba(77, 55, 19, 0.1);
  --shadow-overlay: 0 24px 60px rgba(31, 27, 21, 0.25);
}

@layer base {
  html {
    -webkit-tap-highlight-color: transparent;
  }
  body {
    margin: 0;
    background:
      radial-gradient(circle at 14% 8%, #ffdca5 0%, transparent 30%),
      radial-gradient(circle at 86% 0%, #b6e7dc 0%, transparent 26%),
      linear-gradient(180deg, #f5efdf 0%, #efe4ce 100%);
    color: var(--color-ink);
    font-family: var(--font-body), "Segoe UI", sans-serif;
  }
  a { color: inherit; }
  /* iOS safe area */
  .safe-pb { padding-bottom: env(safe-area-inset-bottom); }
}

@utility text-display-lg { font-family: var(--font-display); font-size: 3rem; line-height: 1.05; letter-spacing: 0.01em; }
@utility text-display-md { font-family: var(--font-display); font-size: 2.25rem; line-height: 1.1; }
@utility text-h1 { font-size: 1.875rem; line-height: 1.2; font-weight: 700; }
@utility text-h2 { font-size: 1.5rem; line-height: 1.25; font-weight: 700; }
@utility text-h3 { font-size: 1.25rem; line-height: 1.3; font-weight: 600; }
@utility text-h4 { font-size: 1.125rem; line-height: 1.35; font-weight: 600; }
@utility text-body-lg { font-size: 1.0625rem; line-height: 1.55; }
@utility text-body { font-size: 0.9375rem; line-height: 1.5; }
@utility text-body-sm { font-size: 0.8125rem; line-height: 1.45; }
@utility text-caption { font-size: 0.75rem; line-height: 1.4; }
@utility text-overline { font-size: 0.6875rem; line-height: 1.2; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 600; }
```

The old `.surface-panel` and `.grid-overlay` classes are intentionally removed — the `<Card>` primitive (Task 4) replaces them. Existing components that still reference `surface-panel` will keep working only if a fallback is kept; Task 27 removes their usages.

- [ ] **Step 2: Add temporary backward-compatible .surface-panel shim**

Append to `app/globals.css` (will be deleted in Task 27):
```css
/* TEMPORARY shim — remove after migration (Task 27) */
.surface-panel {
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-card);
  background: var(--color-surface-elevated);
  box-shadow: var(--shadow-card-lg);
}
```

- [ ] **Step 3: Verify build still passes**

Run:
```bash
npm run build
```

Expected: build succeeds. CSS warnings about unknown utilities are acceptable; errors are not.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "feat(ui): define design tokens via Tailwind v4 @theme"
```

---

## Task 3: Create cn() Class-Merge Helper

**Files:**
- Create: `lib/ui/cn.ts`
- Test: `tests/lib/ui/cn.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/lib/ui/cn.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { cn } from "@/lib/ui/cn";

describe("cn", () => {
  it("merges tailwind classes deduplicating conflicts", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
  it("ignores falsy values", () => {
    expect(cn("a", undefined, false && "b", null, "c")).toBe("a c");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/ui/cn.test.ts`
Expected: FAIL — cannot resolve `@/lib/ui/cn`.

- [ ] **Step 3: Implement cn()**

Create `lib/ui/cn.ts`:
```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `npx vitest run tests/lib/ui/cn.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/ui/cn.ts tests/lib/ui/cn.test.ts
git commit -m "feat(ui): add cn() class-merge helper"
```

---

## Task 4: Create Icon Module

**Files:**
- Create: `components/ui/icon.tsx`

- [ ] **Step 1: Re-export the lucide icons used across the app**

Create `components/ui/icon.tsx`:
```tsx
export {
  ArrowLeft,
  ArrowRight,
  ArrowLeftRight,
  Bell,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  Filter,
  Heart,
  Home,
  Info,
  Layers,
  Loader2,
  LogOut,
  Menu,
  Package,
  Plus,
  Scale,
  Search,
  Settings,
  ShoppingBag,
  Star,
  Tag,
  Trash2,
  TriangleAlert,
  Upload,
  User,
  X,
} from "lucide-react";

export type { LucideIcon } from "lucide-react";
```

- [ ] **Step 2: Verify it imports correctly**

Run:
```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/ui/icon.tsx
git commit -m "feat(ui): add icon module with lucide re-exports"
```

---

## Task 5: Create Button Primitive

**Files:**
- Create: `components/ui/button.tsx`
- Test: `tests/components/ui/button.test.tsx`

- [ ] **Step 1: Write failing test**

Create `tests/components/ui/button.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Comprar</Button>);
    expect(screen.getByRole("button", { name: "Comprar" })).toBeInTheDocument();
  });
  it("disables when loading", () => {
    render(<Button loading>Cargando</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
  it("applies primary variant by default", () => {
    render(<Button>X</Button>);
    expect(screen.getByRole("button").className).toMatch(/bg-accent/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/ui/button.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement Button**

Create `components/ui/button.tsx`:
```tsx
"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/ui/cn";
import { Loader2 } from "@/components/ui/icon";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-input)] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "bg-[var(--color-accent)] text-[var(--color-ink-inverse)] hover:bg-[var(--color-accent-strong)]",
        secondary: "bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)] hover:bg-[var(--color-accent-soft)]/80",
        ghost: "text-[var(--color-ink)] hover:bg-[var(--color-ink)]/5",
        danger: "bg-[var(--color-danger)] text-[var(--color-ink-inverse)] hover:bg-[var(--color-danger)]/90",
        link: "text-[var(--color-accent-strong)] underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-3 text-[0.8125rem]",
        md: "h-11 px-4 text-[0.9375rem]",
        lg: "h-12 px-6 text-[1.0625rem]",
      },
      fullWidth: { true: "w-full" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, fullWidth, asChild, loading, leftIcon, rightIcon, children, disabled, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : leftIcon}
        {children}
        {!loading && rightIcon}
      </Comp>
    );
  }
);
Button.displayName = "Button";
```

- [ ] **Step 4: Run test to verify pass**

Run: `npx vitest run tests/components/ui/button.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/ui/button.tsx tests/components/ui/button.test.tsx
git commit -m "feat(ui): add Button primitive with variants"
```

---

## Task 6: Create Card Primitive

**Files:**
- Create: `components/ui/card.tsx`
- Test: `tests/components/ui/card.test.tsx`

- [ ] **Step 1: Write failing test**

Create `tests/components/ui/card.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card } from "@/components/ui/card";

describe("Card", () => {
  it("renders children inside an article", () => {
    render(<Card>contenido</Card>);
    expect(screen.getByText("contenido")).toBeInTheDocument();
  });
  it("supports interactive variant", () => {
    render(<Card variant="interactive">x</Card>);
    expect(screen.getByText("x").parentElement?.className).toMatch(/transition/);
  });
});
```

- [ ] **Step 2: Run test to verify fail**

Run: `npx vitest run tests/components/ui/card.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement Card**

Create `components/ui/card.tsx`:
```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/ui/cn";

const cardVariants = cva(
  "rounded-[var(--radius-card)] border bg-[var(--color-surface-elevated)]",
  {
    variants: {
      variant: {
        default: "border-[var(--color-border-default)] shadow-[var(--shadow-card)]",
        interactive:
          "border-[var(--color-border-default)] shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-lg)]",
        muted: "border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-none",
        outlined: "border-[var(--color-border-strong)] bg-transparent shadow-none",
      },
      padding: {
        none: "",
        sm: "p-3",
        md: "p-5",
        lg: "p-6",
      },
    },
    defaultVariants: { variant: "default", padding: "md" },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  as?: "div" | "article" | "section";
}

export function Card({ as: Tag = "div", className, variant, padding, ...props }: CardProps) {
  return <Tag className={cn(cardVariants({ variant, padding }), className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-3 flex items-start justify-between gap-3", className)} {...props} />;
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-2", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-4 flex flex-wrap items-center gap-2", className)} {...props} />;
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `npx vitest run tests/components/ui/card.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/ui/card.tsx tests/components/ui/card.test.tsx
git commit -m "feat(ui): add Card primitive with variants and slots"
```

---

## Task 7: Create Chip and Avatar Primitives

**Files:**
- Create: `components/ui/chip.tsx`
- Create: `components/ui/avatar.tsx`
- Test: `tests/components/ui/chip.test.tsx`

- [ ] **Step 1: Write failing test**

Create `tests/components/ui/chip.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Chip } from "@/components/ui/chip";
import { vi } from "vitest";

describe("Chip", () => {
  it("renders label", () => {
    render(<Chip>Pokémon</Chip>);
    expect(screen.getByText("Pokémon")).toBeInTheDocument();
  });
  it("calls onRemove when X clicked", async () => {
    const onRemove = vi.fn();
    render(<Chip onRemove={onRemove}>tag</Chip>);
    await userEvent.click(screen.getByRole("button", { name: /quitar/i }));
    expect(onRemove).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify fail**

Run: `npx vitest run tests/components/ui/chip.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement Chip**

Create `components/ui/chip.tsx`:
```tsx
"use client";
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/ui/cn";
import { X } from "@/components/ui/icon";

const chipVariants = cva(
  "inline-flex items-center gap-1 rounded-[var(--radius-pill)] border font-medium",
  {
    variants: {
      variant: {
        default: "border-[var(--color-border-default)] bg-[var(--color-surface)] text-[var(--color-ink-muted)]",
        accent: "border-transparent bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]",
        success: "border-transparent bg-[var(--color-success-soft)] text-[var(--color-success)]",
        warning: "border-transparent bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
        danger: "border-transparent bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
        info: "border-transparent bg-[var(--color-info-soft)] text-[var(--color-info)]",
      },
      size: {
        sm: "h-6 px-2 text-[0.6875rem]",
        md: "h-7 px-3 text-[0.75rem]",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  }
);

export interface ChipProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof chipVariants> {
  onRemove?: () => void;
  leftIcon?: React.ReactNode;
}

export function Chip({ className, variant, size, onRemove, leftIcon, children, ...props }: ChipProps) {
  return (
    <span className={cn(chipVariants({ variant, size }), className)} {...props}>
      {leftIcon}
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Quitar"
          className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-black/10"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
```

- [ ] **Step 4: Implement Avatar**

Create `components/ui/avatar.tsx`:
```tsx
import * as React from "react";
import { cn } from "@/lib/ui/cn";

const sizeClasses = { sm: "h-6 w-6 text-[0.625rem]", md: "h-8 w-8 text-xs", lg: "h-12 w-12 text-sm" };

export interface AvatarProps {
  name: string;
  src?: string | null;
  size?: keyof typeof sizeClasses;
  className?: string;
}

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-accent-soft)] font-semibold text-[var(--color-accent-strong)]",
        sizeClasses[size],
        className
      )}
      aria-label={name}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        initials || "?"
      )}
    </span>
  );
}
```

- [ ] **Step 5: Run tests to verify pass**

Run: `npx vitest run tests/components/ui/chip.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/ui/chip.tsx components/ui/avatar.tsx tests/components/ui/chip.test.tsx
git commit -m "feat(ui): add Chip and Avatar primitives"
```

---

## Task 8: Create Spinner, Skeleton and EmptyState Primitives

**Files:**
- Create: `components/ui/spinner.tsx`
- Create: `components/ui/skeleton.tsx`
- Create: `components/ui/empty-state.tsx`

- [ ] **Step 1: Implement Spinner**

Create `components/ui/spinner.tsx`:
```tsx
import { Loader2 } from "@/components/ui/icon";
import { cn } from "@/lib/ui/cn";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-4 w-4 animate-spin text-[var(--color-ink-muted)]", className)} aria-label="Cargando" />;
}

export function LoadingOverlay({ label = "Cargando..." }: { label?: string }) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] bg-[var(--color-surface-overlay)] backdrop-blur-sm">
      <div className="flex items-center gap-2 text-[var(--color-ink-muted)]">
        <Spinner />
        <span className="text-[0.8125rem]">{label}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Implement Skeleton**

Create `components/ui/skeleton.tsx`:
```tsx
import { cn } from "@/lib/ui/cn";

const variantClasses = {
  text: "h-4 w-full rounded-md",
  card: "h-32 w-full rounded-[var(--radius-card)]",
  avatar: "h-10 w-10 rounded-full",
  image: "aspect-[3/4] w-full rounded-lg",
} as const;

export function Skeleton({
  variant = "text",
  className,
}: {
  variant?: keyof typeof variantClasses;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-label="Cargando"
      className={cn(
        "animate-pulse bg-[var(--color-border-subtle)]",
        variantClasses[variant],
        className
      )}
    />
  );
}
```

- [ ] **Step 3: Implement EmptyState**

Create `components/ui/empty-state.tsx`:
```tsx
import * as React from "react";
import { cn } from "@/lib/ui/cn";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 px-4 py-12 text-center", className)}>
      {icon && <div className="text-[var(--color-ink-subtle)]">{icon}</div>}
      <p className="text-h3 text-[var(--color-ink)]">{title}</p>
      {description && <p className="max-w-sm text-[0.875rem] text-[var(--color-ink-muted)]">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
```

- [ ] **Step 4: Smoke check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/ui/spinner.tsx components/ui/skeleton.tsx components/ui/empty-state.tsx
git commit -m "feat(ui): add Spinner, Skeleton and EmptyState primitives"
```

---

## Task 9: Create Input, Textarea, Select and FormField Primitives

**Files:**
- Create: `components/ui/input.tsx`
- Create: `components/ui/textarea.tsx`
- Create: `components/ui/select.tsx`
- Create: `components/ui/form-field.tsx`
- Test: `tests/components/ui/form-field.test.tsx`

- [ ] **Step 1: Write failing test for FormField**

Create `tests/components/ui/form-field.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

describe("FormField", () => {
  it("associates label with input via htmlFor", () => {
    render(
      <FormField label="Email" htmlFor="email">
        <Input id="email" />
      </FormField>
    );
    const input = screen.getByLabelText("Email");
    expect(input).toBeInTheDocument();
  });
  it("renders error message", () => {
    render(
      <FormField label="X" htmlFor="x" error="Requerido">
        <Input id="x" />
      </FormField>
    );
    expect(screen.getByText("Requerido")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify fail**

Run: `npx vitest run tests/components/ui/form-field.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement Input**

Create `components/ui/input.tsx`:
```tsx
import * as React from "react";
import { cn } from "@/lib/ui/cn";

const inputClass =
  "h-11 w-full rounded-[var(--radius-input)] border border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] px-3 text-[0.9375rem] text-[var(--color-ink)] placeholder:text-[var(--color-ink-subtle)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 disabled:cursor-not-allowed disabled:opacity-60";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(inputClass, className)} {...props} />
  )
);
Input.displayName = "Input";

export { inputClass };
```

- [ ] **Step 4: Implement Textarea**

Create `components/ui/textarea.tsx`:
```tsx
import * as React from "react";
import { cn } from "@/lib/ui/cn";

const textareaClass =
  "min-h-[88px] w-full rounded-[var(--radius-input)] border border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] px-3 py-2 text-[0.9375rem] text-[var(--color-ink)] placeholder:text-[var(--color-ink-subtle)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 disabled:cursor-not-allowed disabled:opacity-60";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(textareaClass, className)} {...props} />
  )
);
Textarea.displayName = "Textarea";
```

- [ ] **Step 5: Implement Select**

Create `components/ui/select.tsx`:
```tsx
import * as React from "react";
import { cn } from "@/lib/ui/cn";

const selectClass =
  "h-11 w-full appearance-none rounded-[var(--radius-input)] border border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] px-3 pr-9 text-[0.9375rem] text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 disabled:cursor-not-allowed disabled:opacity-60";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select ref={ref} className={cn(selectClass, className)} {...props}>
        {children}
      </select>
      <svg
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-muted)]"
        viewBox="0 0 16 16"
        fill="none"
      >
        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  )
);
Select.displayName = "Select";
```

- [ ] **Step 6: Implement FormField**

Create `components/ui/form-field.tsx`:
```tsx
import * as React from "react";
import { cn } from "@/lib/ui/cn";

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function FormField({ label, htmlFor, hint, error, required, className, children }: FormFieldProps) {
  return (
    <label htmlFor={htmlFor} className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-[0.8125rem] font-medium text-[var(--color-ink)]">
        {label}
        {required && <span className="ml-0.5 text-[var(--color-danger)]">*</span>}
      </span>
      {children}
      {error ? (
        <span role="alert" className="text-[0.75rem] text-[var(--color-danger)]">
          {error}
        </span>
      ) : hint ? (
        <span className="text-[0.75rem] text-[var(--color-ink-subtle)]">{hint}</span>
      ) : null}
    </label>
  );
}
```

- [ ] **Step 7: Run test to verify pass**

Run: `npx vitest run tests/components/ui/form-field.test.tsx`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add components/ui/input.tsx components/ui/textarea.tsx components/ui/select.tsx components/ui/form-field.tsx tests/components/ui/form-field.test.tsx
git commit -m "feat(ui): add Input, Textarea, Select and FormField primitives"
```

---

## Task 10: Create Modal Primitive (radix-dialog wrapper)

**Files:**
- Create: `components/ui/modal.tsx`
- Test: `tests/components/ui/modal.test.tsx`

- [ ] **Step 1: Write failing test**

Create `tests/components/ui/modal.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

describe("Modal", () => {
  it("opens when trigger is clicked", async () => {
    render(
      <Modal trigger={<Button>Abrir</Button>} title="Hola">
        <p>contenido</p>
      </Modal>
    );
    await userEvent.click(screen.getByRole("button", { name: "Abrir" }));
    expect(screen.getByText("contenido")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify fail**

Run: `npx vitest run tests/components/ui/modal.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement Modal**

Create `components/ui/modal.tsx`:
```tsx
"use client";
import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/ui/cn";
import { X } from "@/components/ui/icon";

export interface ModalProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

const sizeClass = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" };

export function Modal({
  trigger,
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[92vh] flex-col rounded-t-[var(--radius-modal)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-overlay)]",
            "md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[var(--radius-modal)]",
            sizeClass[size],
            "md:w-full"
          )}
        >
          <header className="flex items-start justify-between gap-4 border-b border-[var(--color-border-subtle)] px-5 py-4">
            <div className="flex flex-col gap-1">
              <Dialog.Title className="text-h3">{title}</Dialog.Title>
              {description && (
                <Dialog.Description className="text-[0.875rem] text-[var(--color-ink-muted)]">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close
              className="rounded-full p-1 text-[var(--color-ink-muted)] hover:bg-black/5"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </Dialog.Close>
          </header>
          <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && <footer className="border-t border-[var(--color-border-subtle)] px-5 py-3">{footer}</footer>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `npx vitest run tests/components/ui/modal.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/ui/modal.tsx tests/components/ui/modal.test.tsx
git commit -m "feat(ui): add Modal primitive (radix-dialog wrapper)"
```

---

## Task 11: Create Sheet Primitive (Drawer)

**Files:**
- Create: `components/ui/sheet.tsx`

- [ ] **Step 1: Implement Sheet**

Create `components/ui/sheet.tsx`:
```tsx
"use client";
import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/ui/cn";
import { X } from "@/components/ui/icon";

export interface SheetProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: string;
  side?: "right" | "left" | "bottom";
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const sideClass = {
  right: "right-0 top-0 h-full w-full max-w-sm rounded-l-[var(--radius-modal)]",
  left: "left-0 top-0 h-full w-full max-w-sm rounded-r-[var(--radius-modal)]",
  bottom: "inset-x-0 bottom-0 max-h-[90vh] rounded-t-[var(--radius-modal)]",
};

export function Sheet({ trigger, open, onOpenChange, title, description, side = "bottom", children, footer }: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Content
          className={cn(
            "fixed z-50 flex flex-col bg-[var(--color-surface-elevated)] shadow-[var(--shadow-overlay)]",
            sideClass[side]
          )}
        >
          <header className="flex items-start justify-between gap-4 border-b border-[var(--color-border-subtle)] px-5 py-4">
            <div className="flex flex-col gap-1">
              <Dialog.Title className="text-h3">{title}</Dialog.Title>
              {description && (
                <Dialog.Description className="text-[0.875rem] text-[var(--color-ink-muted)]">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close className="rounded-full p-1 text-[var(--color-ink-muted)] hover:bg-black/5" aria-label="Cerrar">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </header>
          <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && <footer className="border-t border-[var(--color-border-subtle)] px-5 py-3">{footer}</footer>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

- [ ] **Step 2: Smoke check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/ui/sheet.tsx
git commit -m "feat(ui): add Sheet primitive (drawer)"
```

---

## Task 12: Create Toast Module (sonner)

**Files:**
- Create: `components/ui/toast.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Implement Toast wrapper**

Create `components/ui/toast.tsx`:
```tsx
"use client";
import { Toaster as Sonner, toast } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-center"
      richColors
      toastOptions={{
        classNames: {
          toast:
            "bg-[var(--color-surface-elevated)] border border-[var(--color-border-default)] text-[var(--color-ink)] shadow-[var(--shadow-card-lg)]",
          title: "font-semibold",
          description: "text-[var(--color-ink-muted)]",
        },
      }}
    />
  );
}

export { toast };
```

- [ ] **Step 2: Mount Toaster in root layout**

Modify `app/layout.tsx` to import and render `<Toaster />` at the end of `<body>`. After existing imports add:
```tsx
import { Toaster } from "@/components/ui/toast";
```

Replace the `<body>` JSX with:
```tsx
<body className="min-h-full flex flex-col">
  {children}
  <Toaster />
</body>
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/ui/toast.tsx app/layout.tsx
git commit -m "feat(ui): mount sonner Toaster globally"
```

---

## Task 13: Create Structured Logger

**Files:**
- Create: `lib/server/logger.ts`
- Test: `tests/lib/server/logger.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/lib/server/logger.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { logger } from "@/lib/server/logger";

describe("logger", () => {
  let spy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    spy = vi.spyOn(console, "log").mockImplementation(() => {});
  });
  it("emits JSON with level, message and context", () => {
    logger.info("hello", { userId: "u1" });
    const arg = spy.mock.calls[0][0] as string;
    const parsed = JSON.parse(arg);
    expect(parsed.level).toBe("info");
    expect(parsed.message).toBe("hello");
    expect(parsed.userId).toBe("u1");
    expect(parsed.timestamp).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify fail**

Run: `npx vitest run tests/lib/server/logger.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement logger**

Create `lib/server/logger.ts`:
```ts
type Level = "debug" | "info" | "warn" | "error";

type Context = Record<string, unknown>;

function emit(level: Level, message: string, context?: Context) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };
  // Single JSON line — Vercel parses it; humans read it
  console.log(JSON.stringify(entry));
}

export const logger = {
  debug: (message: string, context?: Context) => emit("debug", message, context),
  info: (message: string, context?: Context) => emit("info", message, context),
  warn: (message: string, context?: Context) => emit("warn", message, context),
  error: (message: string, context?: Context) => emit("error", message, context),
};
```

- [ ] **Step 4: Run test to verify pass**

Run: `npx vitest run tests/lib/server/logger.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/server/logger.ts tests/lib/server/logger.test.ts
git commit -m "feat(observability): add structured JSON logger"
```

---

## Task 14: Add Request-ID Middleware

**Files:**
- Create: `middleware.ts`
- Test: `tests/middleware.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/middleware.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { middleware } from "@/middleware";

describe("middleware", () => {
  it("adds x-request-id header to response", async () => {
    const req = new Request("https://example.com/x");
    // NextRequest is structurally compatible with Request for our needs
    const res = await middleware(req as unknown as Parameters<typeof middleware>[0]);
    expect(res.headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/);
  });
});
```

- [ ] **Step 2: Run test to verify fail**

Run: `npx vitest run tests/middleware.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement middleware**

Create `middleware.ts`:
```ts
import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const res = NextResponse.next({
    request: { headers: new Headers(req.headers) },
  });
  res.headers.set("x-request-id", requestId);
  res.headers.set("x-content-type-options", "nosniff");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 4: Run test to verify pass**

Run: `npx vitest run tests/middleware.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add middleware.ts tests/middleware.test.ts
git commit -m "feat(observability): add x-request-id middleware"
```

---

## Task 15: Initialize Sentry

**Files:**
- Create: `sentry.client.config.ts`
- Create: `sentry.server.config.ts`
- Create: `sentry.edge.config.ts`
- Create: `instrumentation.ts`
- Modify: `.env.example`

- [ ] **Step 1: Create client config**

Create `sentry.client.config.ts`:
```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  replaysOnErrorSampleRate: 0.1,
  replaysSessionSampleRate: 0,
});
```

- [ ] **Step 2: Create server config**

Create `sentry.server.config.ts`:
```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: Boolean(process.env.SENTRY_DSN),
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
});
```

- [ ] **Step 3: Create edge config**

Create `sentry.edge.config.ts`:
```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: Boolean(process.env.SENTRY_DSN),
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
});
```

- [ ] **Step 4: Create instrumentation entry**

Create `instrumentation.ts`:
```ts
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export { onRequestError } from "@sentry/nextjs";
```

- [ ] **Step 5: Document env vars**

Append to `.env.example`:
```
# Sentry (optional in dev)
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_DSN=
SENTRY_AUTH_TOKEN=
```

- [ ] **Step 6: Verify build**

Run: `npm run build`
Expected: no errors. Sentry is opt-in via DSN env var, so build works without it.

- [ ] **Step 7: Commit**

```bash
git add sentry.client.config.ts sentry.server.config.ts sentry.edge.config.ts instrumentation.ts .env.example
git commit -m "feat(observability): wire Sentry for client/server/edge (opt-in via DSN)"
```

---

## Task 16: Strengthen Security Headers (CSP)

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Replace next.config.ts with CSP-aware version**

Replace `next.config.ts` with:
```ts
import type { NextConfig } from "next";

const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.mercadopago.com https://sdk.mercadopago.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://images.pokemontcg.io https://assets.tcgdex.net https://*.mercadopago.com",
  "connect-src 'self' https://*.supabase.co https://api.mercadopago.com https://*.ingest.sentry.io",
  "frame-src https://www.mercadopago.com.ar https://www.mercadopago.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
];

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "Content-Security-Policy", value: cspDirectives.join("; ") },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
```

- [ ] **Step 2: Verify by curling local dev**

Run:
```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "feat(security): add Content-Security-Policy header"
```

---

## Task 17: Apply Rate Limiting to Public Endpoints

**Files:**
- Modify: `app/api/catalog/[...slug]/route.ts` (or whichever public catalog routes exist)
- Modify: any public listing GET routes

- [ ] **Step 1: Identify the rate-limit helper**

Run:
```bash
grep -rn "rateLimit" lib/ app/api/ --include="*.ts"
```

Read the existing helper file (likely `lib/server/rate-limit.ts`). Note its signature.

- [ ] **Step 2: Apply to catalog route(s)**

For each public GET route under `app/api/catalog/` and any unauthenticated `app/api/listings/route.ts` GET handler:
- Add at the top of the handler the same rate-limit guard pattern used in `app/api/payments/verify/route.ts`.
- Limit: 60 requests per 60 seconds per IP.

Example modification (replace existing GET top):
```ts
import { rateLimit } from "@/lib/server/rate-limit";

export async function GET(req: Request) {
  const limited = rateLimit(req, { key: "catalog", limit: 60, windowMs: 60_000 });
  if (limited) return limited;
  // ... existing handler ...
}
```

(Adjust the `rateLimit` call to match the actual helper signature.)

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add app/api/
git commit -m "feat(security): rate-limit public catalog and listings GET routes"
```

---

## Task 18: Build BottomNav Component

**Files:**
- Create: `components/layout/bottom-nav.tsx`

- [ ] **Step 1: Implement BottomNav**

Create `components/layout/bottom-nav.tsx`:
```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, Layers, Tag, Package, User } from "@/components/ui/icon";
import { cn } from "@/lib/ui/cn";

const items = [
  { href: "/market", label: "Mercado", icon: ShoppingBag },
  { href: "/inventory", label: "Inventario", icon: Layers },
  { href: "/listings", label: "Mis Ventas", icon: Tag },
  { href: "/transactions", label: "Mis Compras", icon: Package },
  { href: "/account", label: "Cuenta", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] safe-pb md:hidden"
    >
      <ul className="flex">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-0.5 text-[0.6875rem]",
                  active
                    ? "text-[var(--color-accent-strong)]"
                    : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 2: Smoke check**

Run: `npx tsc --noEmit`
Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add components/layout/bottom-nav.tsx
git commit -m "feat(layout): add mobile BottomNav"
```

---

## Task 19: Build DashboardSidebar Component (desktop)

**Files:**
- Create: `components/layout/dashboard-sidebar.tsx`

- [ ] **Step 1: Implement DashboardSidebar**

Create `components/layout/dashboard-sidebar.tsx`:
```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, Layers, Tag, Package, User, Bell, Scale } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/ui/cn";

const primary = [
  { href: "/market", label: "Mercado", icon: ShoppingBag },
  { href: "/inventory", label: "Inventario", icon: Layers },
  { href: "/listings", label: "Mis Ventas", icon: Tag },
  { href: "/transactions", label: "Mis Compras", icon: Package },
];

const secondary = [
  { href: "/alerts", label: "Alertas", icon: Bell },
  { href: "/disputes", label: "Disputas", icon: Scale },
  { href: "/account", label: "Cuenta", icon: User },
];

export interface DashboardSidebarProps {
  username: string;
  logoutSlot: React.ReactNode;
}

export function DashboardSidebar({ username, logoutSlot }: DashboardSidebarProps) {
  const pathname = usePathname();
  const renderLink = ({ href, label, icon: Icon }: (typeof primary)[number]) => {
    const active = pathname?.startsWith(href);
    return (
      <li key={href}>
        <Link
          href={href}
          className={cn(
            "flex items-center gap-3 rounded-[var(--radius-input)] px-3 py-2 text-[0.9375rem] transition-colors",
            active
              ? "bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]"
              : "text-[var(--color-ink-muted)] hover:bg-black/5 hover:text-[var(--color-ink)]"
          )}
          aria-current={active ? "page" : undefined}
        >
          <Icon className="h-4 w-4" aria-hidden />
          <span>{label}</span>
        </Link>
      </li>
    );
  };
  return (
    <aside className="hidden md:flex md:w-60 md:shrink-0 md:flex-col md:gap-6 md:border-r md:border-[var(--color-border-subtle)] md:bg-[var(--color-surface-elevated)] md:px-4 md:py-6">
      <Link href="/market" className="text-h2 font-bold text-[var(--color-accent-strong)]">
        TCG Market
      </Link>
      <nav aria-label="Navegación principal" className="flex flex-col gap-6">
        <ul className="flex flex-col gap-1">{primary.map(renderLink)}</ul>
        <div>
          <p className="mb-1 px-3 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">
            Más
          </p>
          <ul className="flex flex-col gap-1">{secondary.map(renderLink)}</ul>
        </div>
      </nav>
      <div className="mt-auto flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-border-subtle)] p-3">
        <Avatar name={username} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.875rem] font-semibold text-[var(--color-ink)]">{username}</p>
          {logoutSlot}
        </div>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Smoke check**

Run: `npx tsc --noEmit`
Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add components/layout/dashboard-sidebar.tsx
git commit -m "feat(layout): add desktop DashboardSidebar"
```

---

## Task 20: Build PageHeader and DashboardShell

**Files:**
- Create: `components/layout/page-header.tsx`
- Create: `components/layout/dashboard-shell.tsx`

- [ ] **Step 1: Implement PageHeader**

Create `components/layout/page-header.tsx`:
```tsx
"use client";
import Link from "next/link";
import { ArrowLeft } from "@/components/ui/icon";

export interface PageHeaderProps {
  title: string;
  backHref?: string;
  actions?: React.ReactNode;
  subtitle?: string;
}

export function PageHeader({ title, backHref, actions, subtitle }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-20 -mx-4 flex items-center gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-b-0 md:bg-transparent md:p-0 md:py-0 md:backdrop-blur-none">
      {backHref && (
        <Link
          href={backHref}
          aria-label="Volver"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5 md:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-h3 md:text-h1">{title}</h1>
        {subtitle && <p className="text-[0.8125rem] text-[var(--color-ink-muted)]">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
```

- [ ] **Step 2: Implement DashboardShell**

Create `components/layout/dashboard-shell.tsx`:
```tsx
import * as React from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";

export interface DashboardShellProps {
  username: string;
  logoutSlot: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardShell({ username, logoutSlot, children }: DashboardShellProps) {
  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <DashboardSidebar username={username} logoutSlot={logoutSlot} />
      <main className="flex-1 px-4 pb-20 pt-3 md:px-8 md:pb-8 md:pt-6">{children}</main>
      <BottomNav />
    </div>
  );
}
```

- [ ] **Step 3: Smoke check**

Run: `npx tsc --noEmit`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add components/layout/page-header.tsx components/layout/dashboard-shell.tsx
git commit -m "feat(layout): add PageHeader and DashboardShell"
```

---

## Task 21: Build PublicHeader and PublicFooter

**Files:**
- Create: `components/layout/public-header.tsx`
- Create: `components/layout/public-footer.tsx`

- [ ] **Step 1: Implement PublicHeader**

Create `components/layout/public-header.tsx`:
```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-h3 font-bold text-[var(--color-accent-strong)]">
          TCG Market
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/market" className="hidden text-[0.9375rem] font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] sm:inline">
            Mercado
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Ingresar</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">Crear cuenta</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Implement PublicFooter**

Create `components/layout/public-footer.tsx`:
```tsx
import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="mt-12 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-[0.8125rem] text-[var(--color-ink-muted)] md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} TCG Market AR — Beta</p>
        <nav className="flex gap-4">
          <Link href="/terms" className="hover:underline">Términos</Link>
          <Link href="/market" className="hover:underline">Mercado</Link>
        </nav>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/layout/public-header.tsx components/layout/public-footer.tsx
git commit -m "feat(layout): add PublicHeader and PublicFooter"
```

---

## Task 22: Migrate Dashboard Layout to DashboardShell

**Files:**
- Modify: `app/(dashboard)/layout.tsx`

- [ ] **Step 1: Replace dashboard layout content**

Replace `app/(dashboard)/layout.tsx` with:
```tsx
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthenticatedUser } from "@/lib/server/auth";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");
  return (
    <DashboardShell
      username={user.username ?? user.email ?? "Vendedor"}
      logoutSlot={<LogoutButton />}
    >
      {children}
    </DashboardShell>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: passes. The pages may still reference `surface-panel` — that's OK, the shim in globals.css covers them until Task 27.

- [ ] **Step 3: Commit**

```bash
git add app/(dashboard)/layout.tsx
git commit -m "refactor(layout): migrate dashboard layout to DashboardShell"
```

---

## Task 23: Migrate Public Layout

**Files:**
- Modify (or create) `app/(public)/layout.tsx`

- [ ] **Step 1: Inspect existing layout**

Read existing file if it exists:
```bash
cat app/\(public\)/layout.tsx 2>/dev/null || echo "no existe"
```

- [ ] **Step 2: Write the new layout**

Create or replace `app/(public)/layout.tsx`:
```tsx
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add app/(public)/layout.tsx
git commit -m "refactor(layout): use PublicHeader and PublicFooter"
```

---

## Task 24: Migrate Login and Register Forms to Primitives

**Files:**
- Modify: `components/login-form.tsx`
- Modify: `components/register-form.tsx`

- [ ] **Step 1: Read existing login form**

```bash
cat components/login-form.tsx
```

- [ ] **Step 2: Refactor login form**

Replace `components/login-form.tsx` with:
```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No pudimos iniciar sesión.");
      return;
    }
    router.push("/inventory");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField label="Email" htmlFor="email" required>
        <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </FormField>
      <FormField label="Contraseña" htmlFor="password" required>
        <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </FormField>
      {error && <p role="alert" className="text-[0.8125rem] text-[var(--color-danger)]">{error}</p>}
      <Button type="submit" loading={loading} fullWidth size="lg">
        Iniciar sesión
      </Button>
      <p className="text-center text-[0.8125rem] text-[var(--color-ink-muted)]">
        ¿No tenés cuenta? <Link href="/register" className="text-[var(--color-accent-strong)] hover:underline">Crear cuenta</Link>
      </p>
    </form>
  );
}
```

- [ ] **Step 3: Read existing register form**

```bash
cat components/register-form.tsx
```

- [ ] **Step 4: Refactor register form**

Replace `components/register-form.tsx` with:
```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

export function RegisterForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!accepted) {
      setError("Tenés que aceptar los términos para continuar.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No pudimos crear la cuenta.");
      return;
    }
    router.push("/inventory");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField label="Usuario" htmlFor="username" required hint="Lo verán otros vendedores y compradores.">
        <Input id="username" required value={username} onChange={(e) => setUsername(e.target.value)} minLength={3} maxLength={24} />
      </FormField>
      <FormField label="Email" htmlFor="email" required>
        <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </FormField>
      <FormField label="Contraseña" htmlFor="password" required hint="Mínimo 8 caracteres.">
        <Input id="password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
      </FormField>
      <label className="flex items-start gap-2 text-[0.875rem] text-[var(--color-ink-muted)]">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-1 h-4 w-4 accent-[var(--color-accent)]"
        />
        <span>
          Acepto los <Link href="/terms" className="text-[var(--color-accent-strong)] hover:underline">términos y condiciones</Link>.
        </span>
      </label>
      {error && <p role="alert" className="text-[0.8125rem] text-[var(--color-danger)]">{error}</p>}
      <Button type="submit" loading={loading} fullWidth size="lg">
        Crear cuenta
      </Button>
      <p className="text-center text-[0.8125rem] text-[var(--color-ink-muted)]">
        ¿Ya tenés cuenta? <Link href="/login" className="text-[var(--color-accent-strong)] hover:underline">Iniciar sesión</Link>
      </p>
    </form>
  );
}
```

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: passes.

- [ ] **Step 6: Commit**

```bash
git add components/login-form.tsx components/register-form.tsx
git commit -m "refactor(auth): migrate Login and Register forms to primitives"
```

---

## Task 25: Migrate MarketListingCard to Card Primitive

**Files:**
- Modify: `components/market-listing-card.tsx`

- [ ] **Step 1: Read current implementation**

```bash
cat components/market-listing-card.tsx
```

- [ ] **Step 2: Refactor to use `<Card>` and tokens**

Replace top-level `<article className="surface-panel p-5">` with `<Card as="article" variant="interactive" padding="md">`. Replace hardcoded color classes with tokens:

- `text-black/55` → `text-[var(--color-ink-muted)]`
- `text-black/50` → `text-[var(--color-ink-subtle)]`
- `bg-black/10` → `bg-[var(--color-border-subtle)]`

Add `import { Card } from "@/components/ui/card";` and remove the now-unused inline classes. Keep the rest of the file's logic untouched.

The full edited file should mirror the existing structure with the `<article>` swapped for `<Card as="article" variant="interactive" padding="md">` and the close tag for `</Card>`.

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add components/market-listing-card.tsx
git commit -m "refactor(market): migrate MarketListingCard to Card primitive"
```

---

## Task 26: Refresh NotificationsBell with Icon and Token Colors

**Files:**
- Modify: `components/notifications-bell.tsx`

- [ ] **Step 1: Read current implementation**

```bash
cat components/notifications-bell.tsx
```

- [ ] **Step 2: Replace emoji with `<Bell>` icon**

Modify the button so it renders the `Bell` icon from `@/components/ui/icon` instead of any emoji or hardcoded glyph. Use the `Button` primitive with `variant="ghost"` and `size="sm"`. Show an unread count badge when count > 0:

```tsx
import { Bell } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

// Inside the component, replace the existing trigger element with:
<Button asChild variant="ghost" size="sm" aria-label="Notificaciones" className="relative">
  <Link href="/alerts">
    <Bell className="h-5 w-5" aria-hidden />
    {unreadCount > 0 && (
      <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[var(--color-danger)] px-1 text-[0.625rem] font-bold text-white">
        {unreadCount > 9 ? "9+" : unreadCount}
      </span>
    )}
  </Link>
</Button>
```

(Adjust to match the actual props of the existing component — keep its data-fetching logic.)

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add components/notifications-bell.tsx
git commit -m "refactor(ui): replace emoji bell with Bell icon and badge"
```

---

## Task 27: Sweep Decorative Emojis and Remove .surface-panel Shim

**Files:**
- Modify: any file using `surface-panel` (use grep)
- Modify: `app/globals.css` (remove shim)

- [ ] **Step 1: Find all .surface-panel usages**

Run:
```bash
grep -rln "surface-panel" app/ components/ --include="*.tsx"
```

- [ ] **Step 2: Replace each with Card primitive or token-based classes**

For each file in the result, edit the JSX:
- `<div className="surface-panel ...">` becomes `<Card variant="default" padding="md" className="...">`. Adjust padding variant to match the file's existing inner padding (e.g. `p-5` → `padding="md"`, `p-4` → `padding="sm"`).
- Remove `surface-panel` from `className`.
- If the element semantically is a card, use `<Card>`; otherwise, replace with a `<div>` styled with `border border-[var(--color-border-default)] rounded-[var(--radius-card)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-card)]`.

- [ ] **Step 3: Find all decorative emoji literals in JSX**

Run:
```bash
grep -rEn "[📇🛒🏷️🔄⚖️🔔🎁🃏✨]" app/ components/ --include="*.tsx"
```

For each match, replace the emoji with a `<lucide>` icon import using the mapping:
- 📇 → `<Layers />`
- 🛒 → `<ShoppingBag />`
- 🏷️ → `<Tag />`
- 🔄 → `<ArrowLeftRight />`
- ⚖️ → `<Scale />`
- 🔔 → `<Bell />`
- 🎁 → `<Package />`
- 🃏 → `<Layers />`
- ✨ → `<Star />`

(Imports go from `@/components/ui/icon`.)

- [ ] **Step 4: Verify nothing greps for "surface-panel" or those emojis**

Run:
```bash
grep -rn "surface-panel" app/ components/ --include="*.tsx" || echo "clean"
```

Expected: `clean`.

- [ ] **Step 5: Remove the shim from globals.css**

Edit `app/globals.css` and delete the entire `.surface-panel` block added in Task 2 step 2.

- [ ] **Step 6: Verify build**

Run: `npm run build`
Expected: passes.

- [ ] **Step 7: Commit**

```bash
git add app/ components/
git commit -m "refactor(ui): replace surface-panel and emojis with primitives + lucide icons"
```

---

## Task 28: Build the UI Kit Showcase Page

**Files:**
- Create: `app/(dev)/ui-kit/page.tsx`
- Create: `app/(dev)/layout.tsx` (only if `(dev)` group does not exist)

- [ ] **Step 1: Create the dev route group layout**

Create `app/(dev)/layout.tsx`:
```tsx
import { notFound } from "next/navigation";

export default function DevLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_DEV_PAGES !== "true") {
    notFound();
  }
  return <div className="mx-auto w-full max-w-3xl px-4 py-6">{children}</div>;
}
```

- [ ] **Step 2: Create UI kit page**

Create `app/(dev)/ui-kit/page.tsx`:
```tsx
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardBody, CardFooter } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Avatar } from "@/components/ui/avatar";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Tag } from "@/components/ui/icon";

export default function UiKitPage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-h1">UI Kit</h1>
        <p className="text-[var(--color-ink-muted)]">Showcase de primitivos. No se sirve en producción.</p>
      </header>

      <section>
        <h2 className="text-h2 mb-3">Buttons</h2>
        <div className="flex flex-wrap gap-2">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="link">Link</Button>
          <Button loading>Loading</Button>
          <Button leftIcon={<Tag className="h-4 w-4" />}>Con icono</Button>
        </div>
      </section>

      <section>
        <h2 className="text-h2 mb-3">Card</h2>
        <Card>
          <CardHeader>
            <h3 className="text-h3">Title</h3>
            <Chip variant="success">Activo</Chip>
          </CardHeader>
          <CardBody>
            <p className="text-[var(--color-ink-muted)]">Cuerpo del card.</p>
          </CardBody>
          <CardFooter>
            <Button size="sm">Acción</Button>
          </CardFooter>
        </Card>
      </section>

      <section>
        <h2 className="text-h2 mb-3">Form</h2>
        <div className="flex flex-col gap-3">
          <FormField label="Nombre" htmlFor="n" required>
            <Input id="n" placeholder="Ej: Charizard" />
          </FormField>
          <FormField label="Notas" htmlFor="notas" hint="Opcional">
            <Textarea id="notas" />
          </FormField>
          <FormField label="Condición" htmlFor="cond">
            <Select id="cond" defaultValue="">
              <option value="">Seleccionar…</option>
              <option value="nm">Near Mint</option>
              <option value="lp">Lightly Played</option>
            </Select>
          </FormField>
          <FormField label="Email" htmlFor="errorx" error="Inválido">
            <Input id="errorx" />
          </FormField>
        </div>
      </section>

      <section>
        <h2 className="text-h2 mb-3">Chips</h2>
        <div className="flex flex-wrap gap-2">
          <Chip>Default</Chip>
          <Chip variant="accent">Accent</Chip>
          <Chip variant="success">Success</Chip>
          <Chip variant="warning">Warning</Chip>
          <Chip variant="danger">Danger</Chip>
          <Chip variant="info">Info</Chip>
        </div>
      </section>

      <section>
        <h2 className="text-h2 mb-3">Avatar</h2>
        <div className="flex items-center gap-2">
          <Avatar name="Thomas Casco" size="sm" />
          <Avatar name="Thomas Casco" size="md" />
          <Avatar name="Thomas Casco" size="lg" />
        </div>
      </section>

      <section>
        <h2 className="text-h2 mb-3">Skeleton & Spinner</h2>
        <div className="flex flex-col gap-2">
          <Skeleton variant="text" />
          <Skeleton variant="card" />
          <Spinner />
        </div>
      </section>

      <section>
        <h2 className="text-h2 mb-3">Empty state</h2>
        <EmptyState title="Sin resultados" description="Probá ajustando los filtros." action={<Button>Limpiar</Button>} />
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add app/(dev)/
git commit -m "chore(ui): add UI kit showcase page (dev only)"
```

---

## Task 29: Document Supabase Key Rotation Runbook

**Files:**
- Create: `docs/runbook/rotate-supabase-keys.md`
- Modify: `.env.example` (verify it has placeholders, not real values)

- [ ] **Step 1: Inspect .env.example**

```bash
cat .env.example
```

Confirm there are no real secrets — only placeholder values like `your-key-here`.

- [ ] **Step 2: Write runbook**

Create `docs/runbook/rotate-supabase-keys.md`:
```markdown
# Runbook: Rotar keys de Supabase

## Cuándo

- Se confirmó que una key estuvo comiteada en git history o expuesta públicamente.
- Cada 6 meses como rotación preventiva.
- Cuando un colaborador con acceso al dashboard deja el equipo.

## Pre-requisitos

- Acceso de owner al proyecto en Supabase.
- Acceso a las env vars de Vercel del proyecto.
- Ventana de mantenimiento (5-10 min). Los usuarios serán deslogueados.

## Pasos

1. **Avisar a los usuarios** vía banner si es horario activo. Programar rotación off-peak.
2. En Supabase Dashboard → Project Settings → API → "Reset Service Role Key". Copiar la nueva.
3. Repetir para "anon key" si fue expuesta.
4. En Vercel → Project → Settings → Environment Variables actualizar `SUPABASE_SERVICE_ROLE_KEY` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en Production y Preview.
5. Trigger redeploy en Vercel (Deployments → Latest → Redeploy).
6. Verificar que la app funciona (login, listing, transacción).
7. Si la key estaba en git history, purgar:
   ```bash
   bfg --replace-text passwords.txt
   git reflog expire --expire=now --all && git gc --prune=now --aggressive
   git push --force
   ```
   (Coordinar con todos los colaboradores: tienen que re-clonar.)

## Validación

- `curl https://<projeto>.vercel.app/api/health` devuelve 200.
- Usuario logueado vuelve a poder iniciar sesión.

## Post

- Anotar en `docs/runbook/incidents.md` fecha + razón.
```

- [ ] **Step 3: Commit**

```bash
git add docs/runbook/rotate-supabase-keys.md
git commit -m "docs: add Supabase key rotation runbook"
```

---

## Task 30: Final Verification — Build, Tests, Lighthouse

**Files:** None (verification only).

- [ ] **Step 1: Full typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 2: Full test suite**

Run: `npm run test`
Expected: all green.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: build succeeds. No warnings about chunks > 300KB on critical routes.

- [ ] **Step 4: Lint**

Run: `npm run lint`
Expected: clean (or pre-existing issues only — no new ones from this phase).

- [ ] **Step 5: Manual smoke (dev server)**

Run: `npm run dev`
Open in mobile-emulator (Chrome DevTools, 375x812):
- `/` renders public header + footer.
- `/login` form renders with primitives.
- `/register` form renders with primitives.
- `/market` listings render in `<Card>` style.
- `/inventory` (logged in) shows DashboardShell: bottom nav at 375px with 5 items, sidebar at 1280px.
- `/ui-kit` (with `ENABLE_DEV_PAGES=true`) shows the showcase.

- [ ] **Step 6: Lighthouse mobile audit**

In Chrome DevTools → Lighthouse → Mobile → run on `/`, `/login`, `/market`. Expected: Performance, Accessibility, Best Practices each ≥ 85. If any fail, file follow-up issues but do not block — Phase 0 acceptance is "≥ 85" and these will be tightened in Phase 7.

- [ ] **Step 7: Final commit**

If any tweaks needed during verification:
```bash
git add .
git commit -m "chore: phase 0 final QA tweaks"
```

Otherwise no commit. Move on.

---

## Self-Review (post-write)

**Spec coverage check:**
- ✅ Tokens (Task 2)
- ✅ Primitivos: Button (5), Card (6), Chip+Avatar (7), Spinner+Skeleton+EmptyState (8), Input/Textarea/Select/FormField (9), Modal (10), Sheet (11), Toast (12), Icon (4)
- ✅ Layout mobile-first: BottomNav (18), DashboardSidebar (19), PageHeader+DashboardShell (20), PublicHeader+PublicFooter (21)
- ✅ Layout migration: dashboard (22), public (23)
- ✅ Critical component migration: login + register (24), market card (25), notifications bell (26)
- ✅ Sweep emojis + remove surface-panel (27)
- ✅ Sentry (15)
- ✅ Logger (13) + middleware/request-id (14)
- ✅ CSP (16)
- ✅ Rate-limit public endpoints (17)
- ✅ Runbook for key rotation (29)
- ✅ UI kit dev page (28)
- ✅ Final QA + Lighthouse (30)

**Outside this plan (intentional):**
- Actual rotation of leaked Supabase keys → manual operator step using runbook (cannot be automated by the agent).
- Purge of git history for `.env.local` → manual operator step.

**Placeholder scan:** No "TBD" / "implement later" / "similar to Task N" without code.

**Type/name consistency:** `Card` slots (`CardHeader`, `CardBody`, `CardFooter`) used consistently. `cn()` import path is `@/lib/ui/cn` everywhere. `@/components/ui/icon` is the lucide re-export source everywhere.

**Decomposition note:** Task 27 sweeps `surface-panel` across whatever files use it; the implementer must run grep first to know the actual file list. This is intentional — the codebase changes between when the plan is written and when it executes.

---

## Execution Handoff

After plan approval, the next step is to dispatch implementation. Two options:

**1. Subagent-Driven (recommended):** fresh subagent per task, two-stage review between tasks, fast iteration.

**2. Inline Execution:** execute all tasks in this session via `superpowers:executing-plans`, with checkpoints for review.

Phase 0 is sequential (no internal parallelization), so either model works. Subagent-driven is recommended for the discipline of independent reviews.
