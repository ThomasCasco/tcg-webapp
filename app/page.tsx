import Link from "next/link";

const features = [
  {
    title: "Inventario simple",
    body: "Cargá tus cartas con foto, condición y stock. Todo en un solo lugar.",
    icon: "📇",
  },
  {
    title: "Precio sugerido",
    body: "Te ayudamos con una referencia de precio para que no publiques a ciegas.",
    icon: "💡",
  },
  {
    title: "Operaciones seguras",
    body: "Seguimiento de pago, entrega y reputación en cada venta.",
    icon: "🛡️",
  },
];

const steps = [
  { n: "01", title: "Cargá tu carta", body: "Foto, condición y cantidad. En menos de un minuto." },
  { n: "02", title: "Poné el precio", body: "Usá el sugerido o el tuyo, y publicá al Mercado." },
  { n: "03", title: "Cerrá la venta", body: "Coordiná entrega con el comprador y confirmá el pago." },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[var(--color-bg)]/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--color-accent)] text-lg font-bold text-white shadow-sm">
              T
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-tight">TCG Market</p>
              <p className="text-[10px] uppercase tracking-[0.15em] subtle">Cartas Pokémon · AR</p>
            </div>
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/market" className="btn btn-ghost btn-sm">
              Mercado
            </Link>
            <Link href="/login" className="btn btn-ghost btn-sm hidden sm:inline-flex">
              Ingresar
            </Link>
            <Link href="/register" className="btn btn-primary btn-sm">
              Crear cuenta
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-4 py-10 md:py-16">
        <section className="grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <span className="chip chip-accent">Marketplace Pokémon TCG</span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight text-[var(--color-ink)] sm:text-5xl md:text-6xl">
              Comprá y vendé cartas{" "}
              <span className="text-[var(--color-accent)]">sin vueltas</span>.
            </h1>
            <p className="mt-5 max-w-xl text-base muted md:text-lg">
              Publicá tu binder, encontrá la carta que te falta y cerrá operaciones con
              un flujo claro de pago y entrega.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/market" className="btn btn-primary btn-lg">
                Explorar mercado
              </Link>
              <Link href="/register" className="btn btn-ghost btn-lg">
                Empezar a vender
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs subtle">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
                Envíos y retiro en persona
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
                Reputación por vendedor
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
                Precios sugeridos
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-[var(--color-accent-soft)] via-transparent to-[var(--color-info-soft)] blur-xl" />
            <div className="card card-hover relative overflow-hidden p-6">
              <div className="flex items-center justify-between">
                <span className="eyebrow">Publicación destacada</span>
                <span className="chip chip-success">Activa</span>
              </div>
              <div className="mt-4 grid grid-cols-[auto_1fr] gap-4">
                <div className="grid h-32 w-24 place-items-center rounded-xl bg-gradient-to-br from-[var(--color-accent)] via-[#8b5cf6] to-[var(--color-info)] text-center text-xs font-bold uppercase tracking-widest text-white shadow-md">
                  Charizard
                </div>
                <div className="min-w-0">
                  <p className="eyebrow">Base Set · Holo</p>
                  <h3 className="mt-1 text-xl font-bold leading-tight">Charizard</h3>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className="chip" style={{ background: "#fde68a", color: "#78350f" }}>
                      Fuego
                    </span>
                    <span className="chip chip-info">Raro</span>
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <div className="price-tag">
                      <span className="currency">ARS</span>
                      <span className="amount">180.000</span>
                    </div>
                    <span className="text-xs muted">@binderboss</span>
                  </div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-[var(--color-surface-muted)] p-2">
                  <p className="eyebrow">Condición</p>
                  <p className="mt-0.5 text-xs font-semibold">Near mint</p>
                </div>
                <div className="rounded-lg bg-[var(--color-surface-muted)] p-2">
                  <p className="eyebrow">Entrega</p>
                  <p className="mt-0.5 text-xs font-semibold">Envío + retiro</p>
                </div>
                <div className="rounded-lg bg-[var(--color-surface-muted)] p-2">
                  <p className="eyebrow">Reputación</p>
                  <p className="mt-0.5 text-xs font-semibold">★ 4.9</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="grid gap-4 md:grid-cols-3">
            {features.map((f) => (
              <article key={f.title} className="card card-hover p-6">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--color-accent-soft)] text-xl">
                  {f.icon}
                </div>
                <h2 className="mt-4 text-lg font-bold tracking-tight">{f.title}</h2>
                <p className="mt-1.5 text-sm muted">{f.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="card p-8 md:p-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="eyebrow">Cómo funciona</span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">Publicar te lleva un minuto.</h2>
            </div>
            <Link href="/register" className="btn btn-soft">
              Crear mi primera publicación →
            </Link>
          </div>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((step) => (
              <li key={step.n} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-5">
                <p className="text-3xl font-bold text-[var(--color-accent)]">{step.n}</p>
                <p className="mt-2 font-semibold">{step.title}</p>
                <p className="mt-1 text-sm muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="card relative overflow-hidden p-8 md:p-12">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent)] to-[#8b5cf6]" />
          <div className="relative grid gap-6 text-white md:grid-cols-[1.4fr_0.6fr] md:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Tu colección merece un lugar decente.
              </h2>
              <p className="mt-3 max-w-xl text-base text-white/85">
                Sumate a TCG Market y empezá a comprar o vender hoy.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <Link href="/register" className="btn btn-lg" style={{ background: "white", color: "var(--color-accent-strong)" }}>
                Crear cuenta gratis
              </Link>
              <Link href="/market" className="btn btn-lg" style={{ background: "rgba(255,255,255,0.12)", color: "white", borderColor: "rgba(255,255,255,0.35)" }}>
                Ver mercado
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs subtle">
          <p>© {new Date().getFullYear()} TCG Market · Cartas Pokémon en Argentina.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-[var(--color-ink)]">
              Términos y Condiciones
            </Link>
            <Link href="/market" className="hover:text-[var(--color-ink)]">
              Mercado
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
