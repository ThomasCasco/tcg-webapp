"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AuctionListing } from "@/lib/domain/types";
import { formatConditionEs } from "@/lib/shared/condition-labels";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Bell, BellOff, CalendarClock, Gavel } from "@/components/ui/icon";

type Props = {
  auction: AuctionListing;
  isLoggedIn: boolean;
};

const statusLabel: Record<AuctionListing["status"], string> = {
  scheduled: "Programada",
  active: "Activa",
  ended: "Finalizada",
  cancelled: "Cancelada",
  settled: "Cerrada",
};

const statusVariant: Record<AuctionListing["status"], "default" | "success" | "warning" | "info"> = {
  scheduled: "info",
  active: "success",
  ended: "default",
  cancelled: "default",
  settled: "default",
};

function formatCountdown(target: Date): string {
  const now = Date.now();
  const diff = target.getTime() - now;
  if (diff <= 0) return "Empezando…";
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `Empieza en ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Empieza en ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Empieza en ${days} d`;
}

export function AuctionListingCard({ auction, isLoggedIn }: Props) {
  const router = useRouter();
  const minBid = auction.currentPriceArs + auction.bidIncrementArs;
  const [amount, setAmount] = useState(String(minBid));
  const [busy, setBusy] = useState(false);
  const [subBusy, setSubBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(Boolean(auction.viewerSubscribed));

  const scheduled = auction.status === "scheduled";
  const ended =
    auction.status === "ended" ||
    auction.status === "cancelled" ||
    auction.status === "settled";
  const active = auction.status === "active";

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

  async function toggleSubscribe() {
    setSubBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/auctions/${auction.id}/subscribe`, {
        method: subscribed ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo actualizar la suscripción.");
      }
      setSubscribed(!subscribed);
      router.refresh();
    } catch (subError) {
      setError(subError instanceof Error ? subError.message : "Error desconocido.");
    } finally {
      setSubBusy(false);
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
        <div className="absolute left-2 top-2 flex gap-1.5">
          <Chip size="sm" variant="warning" className="bg-white/95 backdrop-blur">
            {scheduled ? (
              <>
                <CalendarClock className="h-3 w-3" />
                Próxima
              </>
            ) : (
              <>
                <Gavel className="h-3 w-3" />
                Subasta
              </>
            )}
          </Chip>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[1.0625rem] font-bold leading-tight text-[var(--color-ink)]">
            ARS {auction.currentPriceArs.toLocaleString("es-AR")}
          </p>
          <Chip variant={statusVariant[auction.status]} size="sm">
            {statusLabel[auction.status]}
          </Chip>
        </div>
        <h3 className="line-clamp-2 text-body-sm font-medium text-[var(--color-ink)]">
          {auction.cardName}
        </h3>
        <p className="truncate text-caption text-[var(--color-ink-muted)]">
          {auction.setName || "Sin set"} · {formatConditionEs(auction.condition)}
        </p>

        {scheduled ? (
          <div className="rounded bg-[var(--color-accent-soft)] px-2 py-1.5 text-caption font-semibold text-[var(--color-accent-strong)]">
            <CalendarClock className="mr-1 inline h-3 w-3" />
            {formatCountdown(new Date(auction.startsAt))}
            <p className="mt-0.5 text-[0.7rem] font-normal text-[var(--color-ink-muted)]">
              {new Date(auction.startsAt).toLocaleString("es-AR", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 text-caption text-[var(--color-ink-muted)]">
            <span className="rounded bg-[var(--color-surface)] px-2 py-1">
              {auction.bidCount} ofertas
            </span>
            <span className="rounded bg-[var(--color-surface)] px-2 py-1">
              {new Date(auction.endsAt).toLocaleDateString("es-AR")}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-caption text-[var(--color-ink-subtle)]">
          <span className="truncate">@{auction.sellerHandle}</span>
          {auction.subscriberCount && auction.subscriberCount > 0 ? (
            <span className="flex items-center gap-1">
              <Bell className="h-3 w-3" />
              {auction.subscriberCount}
            </span>
          ) : null}
        </div>

        {scheduled ? (
          <div className="mt-auto space-y-2">
            {isLoggedIn ? (
              <Button
                size="sm"
                fullWidth
                variant={subscribed ? "secondary" : "primary"}
                onClick={toggleSubscribe}
                loading={subBusy}
              >
                {subscribed ? (
                  <>
                    <BellOff className="h-4 w-4" />
                    Cancelar aviso
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4" />
                    Avisame cuando empiece
                  </>
                )}
              </Button>
            ) : (
              <Button asChild size="sm" fullWidth>
                <Link href="/login">Iniciá sesión para anotarte</Link>
              </Button>
            )}
            {error ? (
              <p role="alert" className="text-caption text-[var(--color-danger)]">{error}</p>
            ) : null}
          </div>
        ) : active ? (
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
                <Link href="/login">Iniciá sesión para ofertar</Link>
              </Button>
            )}
            {error ? (
              <p role="alert" className="text-caption text-[var(--color-danger)]">{error}</p>
            ) : null}
          </div>
        ) : ended && auction.winnerHandle ? (
          <p className="mt-auto text-caption text-[var(--color-success)]">
            Ganador: @{auction.winnerHandle}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
