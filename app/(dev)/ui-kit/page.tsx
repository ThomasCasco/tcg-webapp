"use client";
/**
 * UI Kit showcase — accessible at /ui-kit in development.
 * This page is NOT linked from any nav. It's a living style guide
 * for reviewing design tokens, primitives, and component states.
 *
 * To restrict to dev only: add `if (process.env.NODE_ENV === 'production') notFound();`
 */
import { Card, CardHeader, CardBody, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Avatar } from "@/components/ui/avatar";
import { Spinner, LoadingOverlay } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import {
  Bell,
  ShoppingBag,
  Package,
  Tag,
  User,
  Star,
  Heart,
  Search,
  Plus,
  Trash2,
  TriangleAlert,
  Info,
  Scale,
} from "@/components/ui/icon";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="border-b border-[var(--color-border)] pb-2 text-h2">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-caption text-[var(--color-ink-subtle)]">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

export default function UiKitPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-12 px-4 py-10">
      <header>
        <p className="text-overline text-[var(--color-accent-strong)]">TCG Marketplace AR</p>
        <h1 className="mt-1 text-display-md [font-family:var(--font-display)]">
          UI Kit — componentes y tokens
        </h1>
        <p className="mt-2 text-body-sm text-[var(--color-ink-muted)]">
          Página de referencia interna para revisar el design system. No está enlazada en la navegación.
        </p>
      </header>

      {/* ── COLOR TOKENS ── */}
      <Section title="Tokens de color">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { name: "surface", bg: "var(--color-surface)" },
            { name: "surface-elevated", bg: "var(--color-surface-elevated)" },
            { name: "accent", bg: "var(--color-accent)" },
            { name: "accent-strong", bg: "var(--color-accent-strong)" },
            { name: "accent-soft", bg: "var(--color-accent-soft)" },
            { name: "danger", bg: "var(--color-danger)" },
            { name: "danger-soft", bg: "var(--color-danger-soft)" },
            { name: "success", bg: "var(--color-success)" },
            { name: "success-soft", bg: "var(--color-success-soft)" },
            { name: "warning", bg: "var(--color-warning)" },
            { name: "warning-soft", bg: "var(--color-warning-soft)" },
            { name: "info", bg: "var(--color-info)" },
            { name: "info-soft", bg: "var(--color-info-soft)" },
            { name: "ink", bg: "var(--color-ink)" },
            { name: "ink-muted", bg: "var(--color-ink-muted)" },
            { name: "ink-subtle", bg: "var(--color-ink-subtle)" },
          ].map((token) => (
            <div key={token.name} className="flex items-center gap-2">
              <div
                className="h-8 w-8 flex-shrink-0 rounded-lg border border-[var(--color-border)]"
                style={{ backgroundColor: token.bg }}
              />
              <span className="text-caption text-[var(--color-ink-muted)]">{token.name}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── TYPOGRAPHY ── */}
      <Section title="Tipografía">
        <p className="text-display-lg">Display LG — Heading</p>
        <p className="text-display-md">Display MD — Título principal</p>
        <p className="text-h1">H1 — Página</p>
        <p className="text-h2">H2 — Sección</p>
        <p className="text-h3">H3 — Sub-sección</p>
        <p className="text-h4">H4 — Sub-título</p>
        <p className="text-body-lg">Body LG — texto largo con más espacio</p>
        <p className="text-body">Body — texto base de la interfaz</p>
        <p className="text-body-sm">Body SM — texto secundario y formularios</p>
        <p className="text-caption text-[var(--color-ink-muted)]">Caption — etiquetas menores</p>
        <p className="text-overline text-[var(--color-ink-subtle)]">Overline — categorías y supratítulos</p>
      </Section>

      {/* ── BUTTONS ── */}
      <Section title="Button">
        <Row label="Variantes">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="link">Link</Button>
        </Row>
        <Row label="Tamaños">
          <Button size="sm">Small</Button>
          <Button size="md">Medium (default)</Button>
          <Button size="lg">Large</Button>
        </Row>
        <Row label="Estados">
          <Button loading>Cargando</Button>
          <Button disabled>Deshabilitado</Button>
          <Button variant="primary" size="lg" fullWidth>Full Width</Button>
        </Row>
        <Row label="Con ícono">
          <Button size="sm"><Plus className="mr-1 h-3 w-3" />Agregar</Button>
          <Button variant="ghost" size="sm"><Trash2 className="h-4 w-4" /></Button>
          <Button variant="secondary"><Search className="mr-1 h-4 w-4" />Buscar</Button>
        </Row>
      </Section>

      {/* ── CHIPS ── */}
      <Section title="Chip">
        <Row label="Variantes">
          <Chip variant="default">Default</Chip>
          <Chip variant="success">Success</Chip>
          <Chip variant="warning">Warning</Chip>
          <Chip variant="danger">Danger</Chip>
          <Chip variant="info">Info</Chip>
          <Chip variant="accent">Accent</Chip>
        </Row>
        <Row label="Tamaños">
          <Chip size="sm">Small</Chip>
          <Chip size="md">Medium (default)</Chip>
        </Row>
        <Row label="Con onRemove">
          <Chip onRemove={() => {}}>Removable</Chip>
          <Chip variant="accent" onRemove={() => {}}>Charizard</Chip>
        </Row>
      </Section>

      {/* ── AVATAR ── */}
      <Section title="Avatar">
        <Row label="Tamaños">
          <Avatar name="BinderBoss" size="sm" />
          <Avatar name="BinderBoss" size="md" />
          <Avatar name="BinderBoss" size="lg" />
        </Row>
        <Row label="Con imagen">
          <Avatar name="Misty" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/11.png" size="md" />
          <Avatar name="Ash" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/1.png" size="lg" />
        </Row>
      </Section>

      {/* ── SPINNER / SKELETON ── */}
      <Section title="Spinner &amp; Skeleton">
        <Row label="Spinner">
          <Spinner className="h-3 w-3" />
          <Spinner className="h-5 w-5" />
          <Spinner className="h-8 w-8" />
        </Row>
        <Row label="Skeleton">
          <Skeleton variant="text" className="w-32" />
          <Skeleton variant="text" className="w-48" />
          <Skeleton variant="avatar" />
        </Row>
        <div className="space-y-1">
          <p className="text-caption text-[var(--color-ink-subtle)]">Card skeleton</p>
          <Skeleton variant="card" />
        </div>
        <div className="relative h-24">
          <LoadingOverlay />
        </div>
      </Section>

      {/* ── EMPTY STATE ── */}
      <Section title="EmptyState">
        <EmptyState
          icon={<ShoppingBag className="h-8 w-8" />}
          title="Sin publicaciones"
          description="Todavía no hay publicaciones activas en el Mercado."
          action={<Button size="sm">Publicar carta</Button>}
        />
        <EmptyState
          icon={<Package className="h-8 w-8" />}
          title="Inventario vacío"
          description="Agregá cartas a tu inventario para poder publicarlas."
        />
      </Section>

      {/* ── FORM FIELDS ── */}
      <Section title="Form fields">
        <div className="grid max-w-lg gap-4">
          <FormField label="Nombre público" htmlFor="demo-name" required hint="Lo verán otros usuarios.">
            <Input id="demo-name" placeholder="BinderBoss" />
          </FormField>
          <FormField label="Email" htmlFor="demo-email" required>
            <Input id="demo-email" type="email" placeholder="tu@email.com" />
          </FormField>
          <FormField label="Con error" htmlFor="demo-err" error="Formato inválido.">
            <Input id="demo-err" defaultValue="texto malo" />
          </FormField>
          <FormField label="Condición" htmlFor="demo-select">
            <Select id="demo-select">
              <option>Near Mint</option>
              <option>Lightly Played</option>
              <option>Damaged</option>
            </Select>
          </FormField>
          <FormField label="Descripción" htmlFor="demo-textarea" hint="Máx. 280 caracteres.">
            <Textarea id="demo-textarea" rows={3} placeholder="Describí tu pack..." />
          </FormField>
        </div>
      </Section>

      {/* ── CARDS ── */}
      <Section title="Card">
        <Row label="Variantes">
          <Card variant="default" padding="md" className="w-48">
            <p className="text-body-sm">Default</p>
          </Card>
          <Card variant="interactive" padding="md" className="w-48">
            <p className="text-body-sm">Interactive (hover)</p>
          </Card>
          <Card variant="muted" padding="md" className="w-48">
            <p className="text-body-sm">Muted</p>
          </Card>
          <Card variant="outlined" padding="md" className="w-48">
            <p className="text-body-sm">Outlined</p>
          </Card>
        </Row>
        <div className="space-y-1">
          <p className="text-caption text-[var(--color-ink-subtle)]">Con sub-componentes</p>
          <Card className="max-w-sm">
            <CardHeader>
              <div>
                <p className="text-overline text-[var(--color-ink-subtle)]">Carta</p>
                <h3 className="text-h3">Charizard ex</h3>
              </div>
              <Chip variant="success">Near Mint</Chip>
            </CardHeader>
            <CardBody>
              <p className="text-body-sm text-[var(--color-ink-muted)]">
                Scarlet &amp; Violet — 151. Una de las más buscadas.
              </p>
            </CardBody>
            <CardFooter>
              <Chip variant="warning">ARS 45.000</Chip>
              <Button size="sm">Reservar</Button>
            </CardFooter>
          </Card>
        </div>
      </Section>

      {/* ── ICONS ── */}
      <Section title="Íconos (Lucide)">
        <div className="flex flex-wrap gap-4">
          {[Bell, ShoppingBag, Package, Tag, User, Star, Heart, Search, Plus, Trash2, TriangleAlert, Info, Scale].map(
            (Icon, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <Icon className="h-6 w-6 text-[var(--color-ink-muted)]" />
              </div>
            ),
          )}
        </div>
      </Section>

      {/* ── ALERTS ── */}
      <Section title="Alert banners">
        <Card padding="md" className="border-[var(--color-info)] bg-[var(--color-info-soft)]">
          <div className="flex gap-2">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--color-info)]" />
            <p className="text-body-sm text-[var(--color-info)]">
              Información: Configurá Supabase para habilitar la base de datos.
            </p>
          </div>
        </Card>
        <Card padding="md" className="border-[var(--color-warning)] bg-[var(--color-warning-soft)]">
          <div className="flex gap-2">
            <TriangleAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--color-warning)]" />
            <p className="text-body-sm text-[var(--color-warning)]">
              Advertencia: Tu perfil de cobro no está completo.
            </p>
          </div>
        </Card>
        <Card padding="md" className="border-[var(--color-danger)] bg-[var(--color-danger-soft)]">
          <div className="flex gap-2">
            <TriangleAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--color-danger)]" />
            <p className="text-body-sm text-[var(--color-danger)]">
              Error: No se pudo cargar el inventario.
            </p>
          </div>
        </Card>
      </Section>
    </div>
  );
}

