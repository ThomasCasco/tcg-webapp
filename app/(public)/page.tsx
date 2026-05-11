import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MarketListingCard } from "@/components/market-listing-card";
import { listListings } from "@/lib/server/repository";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import {
  ArrowRight,
  Gavel,
  ArrowLeftRight,
  ShieldCheck,
  Wallet,
  Package,
  Sparkles,
} from "@/components/ui/icon";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getAuthenticatedUser();

  let featured: Awaited<ReturnType<typeof listListings>> = [];
  if (isSupabaseConfigured()) {
    try {
      const all = await listListings({ statuses: ["active"], onlyPublic: true });
      featured = all.filter((listing) => listing.listingType !== "mystery_pack").slice(0, 8);
    } catch {
      // Landing still renders without listings.
    }
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section - Bold Yellow Background */}
      <section className="relative bg-[var(--color-primary)] overflow-hidden">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 md:px-6 md:py-24 lg:py-32">
          <div className="max-w-3xl">
            <h1 className="text-[2.75rem] font-bold leading-[1.05] tracking-tight text-[var(--color-ink)] md:text-[4rem] lg:text-[5rem] [font-family:var(--font-display)]">
              El marketplace de cartas Pokemon en Argentina
            </h1>
            <p className="mt-6 max-w-xl text-lg text-[var(--color-ink)]/80 md:text-xl">
              Compra, vende y tradea cartas con coleccionistas de todo el pais. 
              Precios en pesos, pagos con Mercado Pago.
            </p>
            
            <div className="mt-10">
              <Button asChild size="lg" className="bg-[var(--color-ink)] text-white hover:bg-black px-8">
                <Link href="/market">
                  Explorar mercado
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Product Preview Cards - Desktop only */}
        <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-[45%] pr-8">
          <div className="grid grid-cols-2 gap-4 rotate-[-4deg]">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-[3/4] rounded-xl bg-white/90 shadow-lg border border-black/5 overflow-hidden"
              >
                {featured[i - 1]?.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={featured[i - 1].imageUrl ?? ""}
                    alt={featured[i - 1]?.cardName ?? ""}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Stats Bar */}
      <section className="border-b border-[var(--color-border-strong)] bg-white">
        <div className="mx-auto flex w-full max-w-7xl">
          <QuickStat value="24/7" label="Mercado activo" />
          <QuickStat value="ARS" label="Precios locales" />
          <QuickStat value="MP" label="Pagos integrados" />
          <QuickStat value="P2P" label="Envio o retiro" className="hidden sm:flex" />
        </div>
      </section>

      {/* Main Actions - Clear CTAs */}
      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
          <div className="grid gap-4 md:grid-cols-3">
            <ActionCard
              href="/market"
              icon={<Package className="h-6 w-6" />}
              title="Mercado"
              description="Explora cartas publicadas por coleccionistas con precios en pesos"
              primary
            />
            <ActionCard
              href="/auctions"
              icon={<Gavel className="h-6 w-6" />}
              title="Subastas"
              description="Participa en subastas en vivo y consegui cartas a buen precio"
            />
            <ActionCard
              href="/trades"
              icon={<ArrowLeftRight className="h-6 w-6" />}
              title="Trades"
              description="Intercambia cartas directamente con otros coleccionistas"
            />
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-16 md:py-20">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-overline text-[var(--color-ink-subtle)]">
                Recien publicadas
              </p>
              <h2 className="mt-1 text-h1 [font-family:var(--font-display)]">
                Cartas destacadas
              </h2>
            </div>
            <Link
              href="/market"
              className="hidden sm:inline-flex items-center gap-1 text-body-sm font-semibold text-[var(--color-ink)] hover:underline"
            >
              Ver todo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {featured.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] p-12 text-center">
              <Sparkles className="mx-auto h-10 w-10 text-[var(--color-ink-subtle)]" />
              <p className="mt-4 text-body text-[var(--color-ink-muted)]">
                Todavia no hay cartas publicadas
              </p>
              <p className="mt-1 text-body-sm text-[var(--color-ink-subtle)]">
                Se el primero en{" "}
                <Link href="/inventory" className="font-semibold underline">
                  publicar una carta
                </Link>
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
                {featured.map((listing) => (
                  <MarketListingCard
                    key={listing.id}
                    listing={listing}
                    pokemonTypes={null}
                    isLoggedIn={Boolean(user)}
                  />
                ))}
              </div>
              <div className="mt-8 text-center sm:hidden">
                <Button asChild variant="secondary">
                  <Link href="/market">
                    Ver todas las cartas
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-[var(--color-ink)] text-white py-16 md:py-24">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-h1 [font-family:var(--font-display)]">
              Como funciona
            </h2>
            <p className="mt-4 text-body-lg text-white/70">
              Tres pasos simples para comprar o vender cartas
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <StepCard
              step="1"
              title="Explora el mercado"
              description="Busca cartas por nombre, set, condicion o precio. Filtra para encontrar exactamente lo que necesitas."
            />
            <StepCard
              step="2"
              title="Reserva o negocia"
              description="Encontraste algo? Reserva la carta, coordina con el vendedor o propone un trade."
            />
            <StepCard
              step="3"
              title="Coordina la entrega"
              description="Paga con Mercado Pago, coordina envio o retiro en persona. Listo!"
            />
          </div>

          <div className="mt-12 text-center">
            <Button asChild size="lg" className="bg-[var(--color-primary)] text-[var(--color-ink)] hover:bg-[var(--color-primary-strong)]">
              <Link href="/how-it-works">
                Leer la guia completa
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-3">
            <TrustSignal
              icon={<Wallet className="h-6 w-6" />}
              title="Pagos seguros"
              description="Paga con Mercado Pago cuando el vendedor lo tenga conectado, o coordina P2P."
            />
            <TrustSignal
              icon={<ShieldCheck className="h-6 w-6" />}
              title="Vendedores verificados"
              description="Perfil publico, historial de ventas y sistema de reputacion para cada usuario."
            />
            <TrustSignal
              icon={<Package className="h-6 w-6" />}
              title="Envio o retiro"
              description="Cada publicacion indica opciones de entrega. Elegis lo que te convenga."
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-[var(--color-border)] py-16 md:py-20">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6 text-center">
          <h2 className="text-h1 [font-family:var(--font-display)]">
            Listo para empezar?
          </h2>
          <p className="mt-4 text-body-lg text-[var(--color-ink-muted)] max-w-xl mx-auto">
            Unite a la comunidad de coleccionistas de Pokemon TCG en Argentina
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link href="/register">
                Crear cuenta gratis
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/market">
                Explorar sin cuenta
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function QuickStat({
  value,
  label,
  className = "",
}: {
  value: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={`flex-1 flex flex-col items-center justify-center border-l border-[var(--color-border-strong)] py-4 first:border-l-0 ${className}`}>
      <p className="text-xl font-bold text-[var(--color-ink)] md:text-2xl">{value}</p>
      <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-subtle)]">
        {label}
      </p>
    </div>
  );
}

function ActionCard({
  href,
  icon,
  title,
  description,
  primary = false,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex flex-col p-6 rounded-xl border-2 transition-all ${
        primary
          ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] hover:bg-[var(--color-primary)]/30"
          : "border-[var(--color-border)] bg-white hover:border-[var(--color-ink)] hover:shadow-md"
      }`}
    >
      <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${
        primary ? "bg-[var(--color-primary)]" : "bg-[var(--color-surface-muted)]"
      }`}>
        {icon}
      </div>
      <h3 className="mt-4 text-h3 text-[var(--color-ink)]">{title}</h3>
      <p className="mt-2 text-body-sm text-[var(--color-ink-muted)] flex-1">{description}</p>
      <div className="mt-4 inline-flex items-center gap-1 text-body-sm font-semibold text-[var(--color-ink)] group-hover:underline">
        Ir a {title.toLowerCase()}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-2xl font-bold text-[var(--color-ink)]">
        {step}
      </div>
      <h3 className="mt-5 text-h3">{title}</h3>
      <p className="mt-3 text-body-sm text-white/70">{description}</p>
    </div>
  );
}

function TrustSignal({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center p-6">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-surface-muted)]">
        {icon}
      </div>
      <h3 className="mt-5 text-h3 text-[var(--color-ink)]">{title}</h3>
      <p className="mt-2 text-body-sm text-[var(--color-ink-muted)]">{description}</p>
    </div>
  );
}
