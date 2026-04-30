import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const pillars = [
  {
    title: "Inventario sin caos",
    body: "Subí cartas por foto, ordenalas por condición y activalas para venta en segundos.",
  },
  {
    title: "Precio sugerido útil",
    body: "Combinamos referencia externa con mediana local para evitar publicar a ciegas.",
  },
  {
    title: "Transacción trazable",
    body: "Cada operación guarda estado, evidencia y reputación para bajar fricción y fraude.",
  },
];

const flow = [
  "Cargás la carta (foto o selección directa)",
  "La app sugiere precio y publica listing",
  "Comprador paga y ambos confirman el avance",
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 pb-12 md:gap-8 md:pb-16">
        <Card as="section" padding="lg" className="overflow-hidden mt-6 md:mt-8">
          <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:gap-8">
            <div>
              <p className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-white/60 px-3 py-1 text-overline text-[var(--color-accent-strong)]">
                Beta MVP en construcción
              </p>
              <h1 className="mt-4 text-display-lg text-[var(--color-ink)]">
                Vender TCG no debería ser un quilombo.
              </h1>
              <p className="mt-4 max-w-2xl text-body-lg text-[var(--color-ink-muted)]">
                Esta app te ayuda a ordenar inventario, publicar cartas con precio
                sugerido y cerrar operaciones con trazabilidad real.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/inventory">Abrir inventario</Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link href="/market">Ver Mercado</Link>
                </Button>
              </div>
            </div>

            <Card variant="muted" padding="md">
              <p className="text-overline text-[var(--color-ink-subtle)]">
                Objetivo del lanzamiento
              </p>
              <ul className="mt-3 space-y-3 text-body-sm text-[var(--color-ink-muted)]">
                <li>Publicar carta completa en menos de 60 segundos.</li>
                <li>Mostrar top-3 de reconocimiento por foto.</li>
                <li>Verificar pago con webhook + fallback manual.</li>
                <li>Subir reputación por operaciones reales.</li>
              </ul>
              <div className="mt-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-warning-soft)] p-3 text-body-sm text-[var(--color-ink-muted)]">
                Modo actual: foundation técnica + rutas core + APIs iniciales.
              </div>
            </Card>
          </div>
        </Card>

        <section className="grid gap-4 md:grid-cols-3">
          {pillars.map((pillar) => (
            <Card as="article" key={pillar.title} padding="md">
              <h2 className="text-h3 [font-family:var(--font-display)]">
                {pillar.title}
              </h2>
              <p className="mt-2 text-body-sm text-[var(--color-ink-muted)]">{pillar.body}</p>
            </Card>
          ))}
        </section>

        <Card as="section" padding="lg">
          <p className="text-overline text-[var(--color-ink-subtle)]">Flujo MVP</p>
          <ol className="mt-3 grid gap-3 md:grid-cols-3">
            {flow.map((step, index) => (
              <li
                key={step}
                className="rounded-xl border border-[var(--color-border)] bg-white/65 p-4"
              >
                <p className="text-overline text-[var(--color-accent-strong)]">
                  Paso {index + 1}
                </p>
                <p className="mt-1 text-body-sm text-[var(--color-ink-muted)]">{step}</p>
              </li>
            ))}
          </ol>
        </Card>
      </main>
    </div>
  );
}
