"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AuctionListing } from "@/lib/domain/types";
import { formatConditionEs } from "@/lib/shared/condition-labels";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Gavel } from "@/components/ui/icon";

type Props = {
  auction: AuctionListing;
  isLoggedIn: boolean;
};

const statusLabel: Record<AuctionListing["status"], string> = {
  active: "Activa",
  ended: "Finalizada",
  cancelled: "Cancelada",
  settled: "Cerrada",
};

export function AuctionListingCard({ auction, isLoggedIn }: Props) {
  const router = useRouter();
  const minBid = auction.currentPriceArs + auction.bidIncrementArs;
  const [amount, setAmount] = useState(String(minBid));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ended = auction.status !== "active";

  async function bid() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/auctions/${auction.id}/bids`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountArs: Number(amount) }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "No se pudo ofertar.");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Error desconocido.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card as="article" variant="interactive" padding="none" className="group flex flex-col overflow-hidden">
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[var(--color-surface-elevated)]">
        {auction.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={auction.imageUrl}
            alt={auction.cardName}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-caption text-[var(--color-ink-subtle)]">
            Sin foto
          </div>
        )}
        <div className="absolute left-2 top-2">
          <Chip size="sm" variant="warning" className="bg-white/95 backdrop-blur">
            <Gavel className="h-3 w-3" />
            Subasta
          </Chip>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[1.0625rem] font-bold leading-tight text-[var(--color-ink)]">
            ARS {auction.currentPriceArs.toLocaleString("es-AR")}
          </p>
          <Chip variant={ended ? "default" : "success"} size="sm">
            {statusLabel[auction.status]}
          </Chip>
        </div>
        <h3 className="line-clamp-2 text-body-sm font-medium text-[var(--color-ink)]">
          {auction.cardName}
        </h3>
        <p className="truncate text-caption text-[var(--color-ink-muted)]">
          {auction.setName || "Sin set"} · {formatConditionEs(auction.condition)}
        </p>
        <div className="grid grid-cols-2 gap-2 text-caption text-[var(--color-ink-muted)]">
          <span className="rounded bg-[var(--color-surface)] px-2 py-1">
            {auction.bidCount} ofertas
          </span>
          <span className="rounded bg-[var(--color-surface)] px-2 py-1">
            {new Date(auction.endsAt).toLocaleDateString("es-AR")}
          </span>
        </div>
        <p className="truncate text-caption text-[var(--color-ink-subtle)]">
          @{auction.sellerHandle}
        </p>

        {!ended ? (
          <div className="mt-auto space-y-2">
            {isLoggedIn ? (
              <>
                <input
                  type="number"
                  min={minBid}
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="h-9 w-full rounded-[var(--radius-input)] border border-[var(--color-border)] bg-white px-2 text-body-sm outline-none focus:border-[var(--color-accent)]"
                />
                <Button size="sm" fullWidth onClick={bid} loading={busy}>
                  Ofertar
                </Button>
              </>
            ) : (
              <Button asChild size="sm" fullWidth>
                <a href="/login">Inicia sesion para ofertar</a>
              </Button>
            )}
            {error ? (
              <p role="alert" className="text-caption text-[var(--color-danger)]">{error}</p>
            ) : null}
          </div>
        ) : auction.winnerHandle ? (
          <p className="mt-auto text-caption text-[var(--color-success)]">
            Ganador: @{auction.winnerHandle}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
