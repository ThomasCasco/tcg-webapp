import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MarketListingCard } from "@/components/market-listing-card";
import { listListings } from "@/lib/server/repository";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { Logo } from "@/components/ui/logo";
import {
  ArrowRight,
  Gavel,
  ArrowLeftRight,
  ShieldCheck,
  Wallet,
  Package,
  Sparkles,
  Zap,
  Users,
  Heart,
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
    <div className="flex flex-col overflow-hidden">
      {/* Hero Section - Vibrant and Welcoming */}
      <section className="relative bg-gradient-to-br from-[var(--color-surface)] via-[var(--color-primary-soft)] to-[var(--color-secondary-soft)] overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-[var(--color-primary)]/10 rounded-full blur-3xl animate-float" />
          <div className="absolute top-1/2 -left-32 w-80 h-80 bg-[var(--color-secondary)]/10 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[var(--color-primary)]/5 rounded-full blur-2xl animate-float" />
        </div>
        
        <div className="relative mx-auto w-full max-w-7xl px-4 py-16 md:px-6 md:py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-sm px-4 py-2 text-sm font-medium text-[var(--color-ink-muted)] shadow-sm mb-6">
                <Sparkles className="h-4 w-4 text-[var(--color-secondary)]" />
                El marketplace #1 de Pokemon TCG en Argentina
              </div>
              
              <h1 className="text-[2.5rem] md:text-[3.5rem] lg:text-[4rem] font-bold leading-[1.05] tracking-tight [font-family:var(--font-display)]">
                <span className="text-[var(--color-ink)]">Encontra tu </span>
                <span className="text-gradient-primary">proxima joya</span>
                <span className="text-[var(--color-ink)]"> Pokemon</span>
              </h1>
              
              <p className="mt-6 max-w-xl text-lg text-[var(--color-ink-muted)] md:text-xl leading-relaxed">
                Conectamos coleccionistas de todo el pais. Compra, vende y tradea 
                con precios en pesos y pagos seguros con Mercado Pago.
              </p>
              
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="px-8 shadow-lg hover:shadow-xl transition-shadow">
                  <Link href="/market">
                    <Zap className="h-5 w-5" />
                    Explorar mercado
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary" className="shadow-sm">
                  <Link href="/how-it-works">
                    Como funciona
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {/* Social Proof */}
              <div className="mt-10 flex items-center gap-6">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-10 w-10 rounded-full border-2 border-white bg-gradient-to-br from-[var(--color-primary-soft)] to-[var(--color-secondary-soft)] flex items-center justify-center text-sm font-bold text-[var(--color-primary)]"
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-[var(--color-ink-muted)]">
                  <span className="font-semibold text-[var(--color-ink)]">+500 coleccionistas</span>
                  <br />
                  ya confian en TCG.ar
                </p>
              </div>
            </div>

            {/* Floating Cards Preview */}
            <div className="hidden lg:block relative h-[500px]">
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Main Card */}
                <div className="absolute z-20 animate-float">
                  <div className="w-56 aspect-[3/4] rounded-2xl bg-white shadow-2xl overflow-hidden border border-white/50 transform rotate-3">
                    {featured[0]?.imageUrl ? (
                      <img
                        src={featured[0].imageUrl}
                        alt={featured[0]?.cardName ?? "Pokemon"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-[var(--color-primary-soft)] to-[var(--color-secondary-soft)] flex items-center justify-center">
                        <Logo size="lg" showText={false} />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Background Cards */}
                <div className="absolute z-10 -translate-x-24 translate-y-8 animate-float-delayed">
                  <div className="w-48 aspect-[3/4] rounded-2xl bg-white/80 shadow-xl overflow-hidden border border-white/30 transform -rotate-12 backdrop-blur">
                    {featured[1]?.imageUrl ? (
                      <img
                        src={featured[1].imageUrl}
                        alt={featured[1]?.cardName ?? "Pokemon"}
                        className="h-full w-full object-cover opacity-90"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-[var(--color-secondary-soft)] to-[var(--color-primary-soft)]" />
                    )}
                  </div>
                </div>
                
                <div className="absolute z-0 translate-x-28 -translate-y-4 animate-float">
                  <div className="w-44 aspect-[3/4] rounded-2xl bg-white/60 shadow-lg overflow-hidden border border-white/20 transform rotate-12 backdrop-blur">
                    {featured[2]?.imageUrl ? (
                      <img
                        src={featured[2].imageUrl}
                        alt={featured[2]?.cardName ?? "Pokemon"}
                        className="h-full w-full object-cover opacity-80"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-[var(--color-primary-soft)] to-[var(--color-success-soft)]" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Features Bar */}
      <section className="relative -mt-8 z-10 px-4 md:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <FeatureChip icon={<Wallet className="h-5 w-5" />} label="Precios en ARS" />
            <FeatureChip icon={<ShieldCheck className="h-5 w-5" />} label="Pagos seguros" />
            <FeatureChip icon={<Package className="h-5 w-5" />} label="Envio o retiro" />
            <FeatureChip icon={<Users className="h-5 w-5" />} label="Comunidad activa" />
          </div>
        </div>
      </section>

      {/* Main Actions - Clear CTAs */}
      <section className="py-20 md:py-28">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
          <div className="text-center mb-12 animate-fade-in">
            <p className="text-overline text-[var(--color-primary)]">
              Que queres hacer hoy?
            </p>
            <h2 className="mt-3 text-h1 md:text-display-md [font-family:var(--font-display)]">
              Tu aventura empieza aca
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <ActionCard
              href="/market"
              icon={<Package className="h-7 w-7" />}
              title="Mercado"
              description="Explora publicaciones de coleccionistas de todo el pais con precios en pesos"
              color="primary"
              delay={0}
            />
            <ActionCard
              href="/auctions"
              icon={<Gavel className="h-7 w-7" />}
              title="Subastas"
              description="Participa en subastas en vivo y consegui joyas a precios increibles"
              color="secondary"
              delay={100}
            />
            <ActionCard
              href="/trades"
              icon={<ArrowLeftRight className="h-7 w-7" />}
              title="Trades"
              description="Intercambia directamente con otros coleccionistas sin intermediarios"
              color="success"
              delay={200}
            />
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-16 md:py-24 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
          <div className="flex items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-overline text-[var(--color-secondary)]">
                Recien publicadas
              </p>
              <h2 className="mt-2 text-h1 md:text-display-md [font-family:var(--font-display)]">
                Lo mas nuevo
              </h2>
            </div>
            <Link
              href="/market"
              className="hidden sm:inline-flex items-center gap-2 text-body font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-strong)] transition-colors"
            >
              Ver todo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {featured.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] p-16 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-[var(--color-primary-soft)] flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-[var(--color-primary)]" />
              </div>
              <p className="text-body-lg text-[var(--color-ink)]">
                Todavia no hay publicaciones
              </p>
              <p className="mt-2 text-body text-[var(--color-ink-muted)]">
                Se el primero en{" "}
                <Link href="/inventory" className="font-semibold text-[var(--color-primary)] hover:underline">
                  publicar algo
                </Link>
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4">
                {featured.map((listing, i) => (
                  <div key={listing.id} className="animate-scale-in" style={{ animationDelay: `${i * 50}ms` }}>
                    <MarketListingCard
                      listing={listing}
                      pokemonTypes={null}
                      isLoggedIn={Boolean(user)}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-10 text-center sm:hidden">
                <Button asChild variant="secondary" size="lg">
                  <Link href="/market">
                    Ver todas las publicaciones
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-[var(--color-ink)] to-[#2d2926]">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-overline text-[var(--color-secondary)]">
              Super simple
            </p>
            <h2 className="mt-3 text-h1 md:text-display-md text-white [font-family:var(--font-display)]">
              Asi de facil funciona
            </h2>
            <p className="mt-4 text-body-lg text-white/60">
              Tres pasos y estas listo para comprar o vender
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <StepCard
              step="1"
              title="Explora"
              description="Busca por nombre, set, condicion o precio. Usa filtros para encontrar exactamente lo que necesitas."
              delay={0}
            />
            <StepCard
              step="2"
              title="Conecta"
              description="Reserva tu favorito, chatea con el vendedor o propone un trade. Todo en un solo lugar."
              delay={150}
            />
            <StepCard
              step="3"
              title="Disfruta"
              description="Paga seguro con Mercado Pago y coordina el envio o retiro. Tu coleccion crece!"
              delay={300}
            />
          </div>

          <div className="mt-14 text-center">
            <Button asChild size="lg" className="bg-[var(--color-secondary)] hover:bg-[var(--color-secondary-strong)] text-[var(--color-ink)]">
              <Link href="/how-it-works">
                Leer la guia completa
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-20 md:py-28">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
          <div className="text-center mb-14">
            <h2 className="text-h1 md:text-display-md [font-family:var(--font-display)]">
              Por que elegir TCG.ar?
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <TrustSignal
              icon={<Wallet className="h-7 w-7" />}
              title="Pagos seguros"
              description="Paga con Mercado Pago cuando el vendedor lo tenga conectado, o coordina P2P con total libertad."
              color="primary"
            />
            <TrustSignal
              icon={<ShieldCheck className="h-7 w-7" />}
              title="Comunidad verificada"
              description="Perfil publico, historial de ventas y sistema de reputacion para cada usuario."
              color="secondary"
            />
            <TrustSignal
              icon={<Heart className="h-7 w-7" />}
              title="Hecho para vos"
              description="Pensado por y para coleccionistas argentinos. Precios locales, envios locales."
              color="success"
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-[var(--color-primary-soft)] via-white to-[var(--color-secondary-soft)]">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-h1 md:text-display-md [font-family:var(--font-display)]">
              Unite a la comunidad
            </h2>
            <p className="mt-4 text-body-lg text-[var(--color-ink-muted)]">
              Crea tu cuenta gratis y empeza a comprar, vender o tradear hoy mismo
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="px-10 shadow-lg">
                <Link href="/register">
                  Crear cuenta gratis
                  <Sparkles className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/market">
                  Explorar sin cuenta
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-4 shadow-lg border border-[var(--color-border-subtle)]">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
        {icon}
      </div>
      <span className="text-sm font-semibold text-[var(--color-ink)]">{label}</span>
    </div>
  );
}

function ActionCard({
  href,
  icon,
  title,
  description,
  color = "primary",
  delay = 0,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color?: "primary" | "secondary" | "success";
  delay?: number;
}) {
  const colors = {
    primary: {
      bg: "bg-[var(--color-primary-soft)]",
      icon: "bg-[var(--color-primary)] text-white",
      hover: "hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)]",
    },
    secondary: {
      bg: "bg-[var(--color-secondary-soft)]",
      icon: "bg-[var(--color-secondary)] text-white",
      hover: "hover:shadow-[0_8px_30px_rgba(245,158,11,0.15)]",
    },
    success: {
      bg: "bg-[var(--color-success-soft)]",
      icon: "bg-[var(--color-success)] text-white",
      hover: "hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)]",
    },
  };

  const c = colors[color];

  return (
    <Link
      href={href}
      className={`group relative flex flex-col p-8 rounded-2xl border border-[var(--color-border)] bg-white transition-all duration-300 hover:border-transparent hover:-translate-y-1 ${c.hover} animate-slide-up`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${c.icon} shadow-lg`}>
        {icon}
      </div>
      <h3 className="mt-6 text-h3 text-[var(--color-ink)]">{title}</h3>
      <p className="mt-3 text-body text-[var(--color-ink-muted)] flex-1 leading-relaxed">{description}</p>
      <div className="mt-6 inline-flex items-center gap-2 text-body font-semibold text-[var(--color-ink)] group-hover:text-[var(--color-primary)] transition-colors">
        Ir a {title.toLowerCase()}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

function StepCard({
  step,
  title,
  description,
  delay = 0,
}: {
  step: string;
  title: string;
  description: string;
  delay?: number;
}) {
  return (
    <div
      className="relative text-center p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-secondary)] to-[var(--color-secondary-strong)] text-2xl font-bold text-[var(--color-ink)] shadow-lg">
        {step}
      </div>
      <h3 className="mt-6 text-h3 text-white">{title}</h3>
      <p className="mt-3 text-body text-white/60 leading-relaxed">{description}</p>
    </div>
  );
}

function TrustSignal({
  icon,
  title,
  description,
  color = "primary",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color?: "primary" | "secondary" | "success";
}) {
  const colors = {
    primary: "bg-[var(--color-primary-soft)] text-[var(--color-primary)]",
    secondary: "bg-[var(--color-secondary-soft)] text-[var(--color-secondary)]",
    success: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  };

  return (
    <div className="group text-center p-8 rounded-2xl border border-[var(--color-border)] bg-white transition-all hover:shadow-lg hover:-translate-y-1">
      <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${colors[color]} transition-transform group-hover:scale-110`}>
        {icon}
      </div>
      <h3 className="mt-6 text-h3 text-[var(--color-ink)]">{title}</h3>
      <p className="mt-3 text-body text-[var(--color-ink-muted)] leading-relaxed">{description}</p>
    </div>
  );
}
