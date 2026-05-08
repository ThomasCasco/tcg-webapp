import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchCatalogCardById } from "@/lib/server/tcgdex";

export const dynamic = "force-dynamic";

export default async function CatalogCardPage({
  params,
}: {
  params: Promise<{ cardId: string }>;
}) {
  const { cardId } = await params;
  const card = await fetchCatalogCardById(cardId).catch(() => null);
  if (!card) notFound();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-6 md:py-8">
      <Link href="/market" className="text-sm text-[var(--color-accent-strong)] underline">
        Volver al mercado
      </Link>

      <section className="surface-panel p-6 md:p-8">
        <div className="grid gap-5 md:grid-cols-[220px_1fr]">
          {card.imageLarge || card.imageSmall ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={card.imageLarge ?? card.imageSmall ?? ""}
              alt={card.name}
              className="h-[320px] w-[220px] rounded-[var(--radius-card)] border border-[var(--color-border-default)] object-cover"
            />
          ) : (
            <div className="grid h-[320px] w-[220px] place-items-center rounded-[var(--radius-card)] border border-[var(--color-border-default)] bg-[var(--color-surface-muted)] text-body-sm text-[var(--color-ink-subtle)]">
              Sin imagen de catálogo
            </div>
          )}

          <div>
            <p className="text-overline text-[var(--color-ink-subtle)]">
              {card.setName || "Set desconocido"}
            </p>
            <h1 className="mt-1 text-4xl [font-family:var(--font-display)]">{card.name}</h1>
            <p className="mt-2 text-body-sm text-[var(--color-ink-muted)]">
              Origen: {card.setName || "n/d"}
              {card.number ? ` · Nº ${card.number}` : ""}
              {card.setId ? ` · Set ${card.setId}` : ""}
            </p>
            {card.rarity ? (
              <p className="mt-1 text-body-sm text-[var(--color-ink-muted)]">Rareza: {card.rarity}</p>
            ) : null}

            {card.marketPriceEur ? (
              <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--color-border-default)] bg-[var(--color-surface)] p-3 text-body-sm text-[var(--color-ink-muted)]">
                <p className="font-semibold text-[var(--color-ink)]">Referencia internacional</p>
                <p className="mt-1">EUR {card.marketPriceEur.toFixed(2)} (Cardmarket)</p>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
