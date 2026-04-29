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
              className="h-[320px] w-[220px] rounded-xl object-cover"
            />
          ) : (
            <div className="grid h-[320px] w-[220px] place-items-center rounded-xl bg-black/10 text-sm text-black/50">
              Sin imagen de catálogo
            </div>
          )}

          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-black/55">
              {card.setName || "Set desconocido"}
            </p>
            <h1 className="mt-1 text-4xl [font-family:var(--font-display)]">{card.name}</h1>
            <p className="mt-2 text-sm text-black/65">
              Origen: {card.setName || "n/d"}
              {card.number ? ` · Nº ${card.number}` : ""}
              {card.setId ? ` · Set ${card.setId}` : ""}
            </p>
            {card.rarity ? (
              <p className="mt-1 text-sm text-black/65">Rareza: {card.rarity}</p>
            ) : null}

            {(card.marketPriceEur || card.marketPriceUsdEstimate) ? (
              <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-white/70 p-3 text-sm text-black/75">
                <p className="font-semibold text-black/85">Referencia internacional</p>
                {card.marketPriceEur ? (
                  <p className="mt-1">EUR {card.marketPriceEur.toFixed(2)} (Cardmarket)</p>
                ) : null}
                {card.marketPriceUsdEstimate ? (
                  <p>USD {card.marketPriceUsdEstimate.toFixed(2)} (estimado)</p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
