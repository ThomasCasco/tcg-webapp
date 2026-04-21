import Link from "next/link";

const pillars = [
  {
    title: "Inventario sin caos",
    body: "Subi cartas por foto, ordenalas por condicion y activalas para venta en segundos.",
  },
  {
    title: "Precio sugerido util",
    body: "Combinamos referencia externa con mediana local para evitar publicar a ciegas.",
  },
  {
    title: "Transaccion trazable",
    body: "Cada operacion guarda estado, evidencia y reputacion para bajar friccion y fraude.",
  },
];

const flow = [
  "Cargas la carta (foto o seleccion directa)",
  "La app sugiere precio y publica listing",
  "Comprador paga y ambos confirman el avance",
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 md:py-8">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--color-accent)] text-white">
            T
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent-strong)]">
              TCG Marketplace AR
            </p>
            <p className="text-sm text-black/70">Pokemon-first para vender mejor</p>
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            href="/market"
            className="rounded-full border border-[var(--color-border)] px-4 py-2 hover:bg-white/70"
          >
            Mercado
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-[var(--color-border)] px-4 py-2 hover:bg-white/70"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-white hover:bg-[var(--color-accent-strong)]"
          >
            Empezar
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 pb-12 md:gap-8 md:pb-16">
        <section className="surface-panel overflow-hidden p-6 md:p-10">
          <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:gap-8">
            <div>
              <p className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-white/60 px-3 py-1 text-xs uppercase tracking-[0.15em] text-[var(--color-accent-strong)]">
                Beta MVP en construccion
              </p>
              <h1 className="mt-4 text-5xl leading-[0.92] text-[var(--color-ink)] sm:text-6xl md:text-7xl [font-family:var(--font-display)]">
                Vender TCG no deberia ser un quilombo.
              </h1>
              <p className="mt-4 max-w-2xl text-base text-black/70 md:text-lg">
                Esta app te ayuda a ordenar inventario, publicar cartas con precio
                sugerido y cerrar operaciones con trazabilidad real.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/inventory"
                  className="rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-accent-strong)]"
                >
                  Abrir inventario
                </Link>
                <Link
                  href="/listings"
                  className="rounded-full border border-[var(--color-border)] bg-white/60 px-5 py-2.5 text-sm font-semibold hover:bg-white"
                >
                  Crear listing
                </Link>
              </div>
            </div>

            <div className="grid-overlay rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-black/55">
                Objetivo del lanzamiento
              </p>
              <ul className="mt-3 space-y-3 text-sm text-black/75">
                <li>Publicar carta completa en menos de 60 segundos.</li>
                <li>Mostrar top-3 de reconocimiento por foto.</li>
                <li>Verificar pago con webhook + fallback manual.</li>
                <li>Subir reputacion por operaciones reales.</li>
              </ul>
              <div className="mt-5 rounded-xl border border-[var(--color-border)] bg-[#fff2dc] p-3 text-sm text-black/70">
                Modo actual: foundation tecnica + rutas core + APIs iniciales.
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {pillars.map((pillar) => (
            <article key={pillar.title} className="surface-panel p-5">
              <h2 className="text-xl [font-family:var(--font-display)]">
                {pillar.title}
              </h2>
              <p className="mt-2 text-sm text-black/70">{pillar.body}</p>
            </article>
          ))}
        </section>

        <section className="surface-panel p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.14em] text-black/55">
            Flujo MVP
          </p>
          <ol className="mt-3 grid gap-3 md:grid-cols-3">
            {flow.map((step, index) => (
              <li
                key={step}
                className="rounded-xl border border-[var(--color-border)] bg-white/65 p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-accent-strong)]">
                  Paso {index + 1}
                </p>
                <p className="mt-1 text-sm text-black/75">{step}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
