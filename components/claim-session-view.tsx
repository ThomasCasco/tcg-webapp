"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ClaimSession, ClaimSessionCard } from "@/lib/domain/types";
import { formatConditionEs } from "@/lib/shared/condition-labels";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { CheckCircle, SkipForward, Zap } from "@/components/ui/icon";

type Props = {
  session: ClaimSession;
  isSeller: boolean;
  viewerUserId?: string;
};

export function ClaimSessionView({ session: initialSession, isSeller, viewerUserId }: Props) {
  const router = useRouter();
  const [session, setSession] = useState(initialSession);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const cards = session.cards ?? [];
  const current = cards.find((c) => c.status === "available");
  const past = cards.filter((c) => c.status === "claimed" || c.status === "skipped");
  const upcoming = cards.filter((c) => c.status === "pending");

  async function apiPost(path: string, body?: object): Promise<ClaimSession | null> {
    const res = await fetch(`/api/claims/${session.id}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json() as ClaimSession & { error?: string };
    if (!res.ok) throw new Error(data.error ?? "Error");
    return data;
  }

  function handleAction(fn: () => Promise<ClaimSession | null>) {
    setError(null);
    startTransition(async () => {
      try {
        const updated = await fn();
        if (updated) setSession(updated);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido.");
      }
    });
  }

  async function handleClaim(card: ClaimSessionCard) {
    setClaimingId(card.id);
    setError(null);
    try {
      const res = await fetch(`/api/claims/${session.id}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: card.id }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Error");
      const updated = await fetch(`/api/claims/${session.id}`).then((r) => r.json() as Promise<ClaimSession>);
      setSession(updated);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setClaimingId(null);
    }
  }

  const statusLabel: Record<string, string> = {
    draft: "Borrador",
    active: "En curso",
    ended: "Terminada",
  };

  const statusVariant: Record<string, "success" | "warning" | "info" | "default"> = {
    draft: "default",
    active: "success",
    ended: "info",
  };

  return (
    <div className="space-y-4">
      <Card padding="lg">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-overline text-[var(--color-ink-subtle)]">@{session.sellerHandle}</p>
            <h2 className="mt-1 text-h2 [font-family:var(--font-display)]">{session.title}</h2>
            {session.description && (
              <p className="mt-1 text-body-sm text-[var(--color-ink-muted)]">{session.description}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              <Chip variant={statusVariant[session.status] ?? "default"}>
                {statusLabel[session.status] ?? session.status}
              </Chip>
              {session.claimedCount !== undefined && session.claimedCount > 0 && (
                <Chip variant="success">{session.claimedCount} claimada{session.claimedCount !== 1 ? "s" : ""}</Chip>
              )}
              {upcoming.length > 0 && (
                <Chip>{upcoming.length} restante{upcoming.length !== 1 ? "s" : ""}</Chip>
              )}
            </div>
          </div>

          {isSeller && (
            <div className="flex flex-wrap gap-2">
              {session.status === "draft" && (
                <Button onClick={() => handleAction(() => apiPost("/start"))} loading={isPending}>
                  Iniciar sesión
                </Button>
              )}
              {session.status === "active" && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => handleAction(() => apiPost("/advance", { skip: true }))}
                    loading={isPending}
                    disabled={!current}
                  >
                    <SkipForward className="h-4 w-4" />
                    Pasar carta
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => handleAction(() => apiPost("/end"))}
                    loading={isPending}
                  >
                    Terminar sesión
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </Card>

      {error && (
        <p role="alert" className="rounded-[var(--radius-card)] border border-[var(--color-danger)] bg-rose-50 px-4 py-2 text-body-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}

      {session.status === "active" && current && (
        <Card padding="lg" className="border-[var(--color-success)] bg-[var(--color-success-soft)]">
          <p className="text-overline text-[var(--color-ink-subtle)]">Carta actual</p>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-center">
            {current.imageUrl && (
              <Image
                src={current.imageUrl}
                alt={current.cardName}
                width={160}
                height={224}
                className="h-40 w-auto rounded-[var(--radius-card)] object-contain"
              />
            )}
            <div className="flex-1">
              <h3 className="text-h2 [font-family:var(--font-display)]">{current.cardName}</h3>
              <div className="mt-1 flex flex-wrap gap-2">
                {current.setName && <Chip variant="info">{current.setName}</Chip>}
                <Chip>{formatConditionEs(current.condition)}</Chip>
              </div>
              <p className="mt-3 text-h3 font-bold">
                {current.priceArs === 0 ? (
                  <span className="text-[var(--color-success)]">FREE</span>
                ) : (
                  <>ARS {current.priceArs.toLocaleString("es-AR")}</>
                )}
              </p>
              {!isSeller && viewerUserId && (
                <Button
                  className="mt-3"
                  onClick={() => handleClaim(current)}
                  loading={claimingId === current.id}
                  disabled={Boolean(claimingId)}
                >
                  <Zap className="h-4 w-4" />
                  {current.priceArs === 0 ? "¡Tomar free!" : "Claimar"}
                </Button>
              )}
              {!viewerUserId && (
                <p className="mt-3 text-body-sm text-[var(--color-ink-muted)]">
                  Iniciá sesión para claimear.
                </p>
              )}
              {isSeller && (
                <p className="mt-3 text-body-sm text-[var(--color-ink-muted)]">
                  Esta es tu carta activa. Los compradores la ven en tiempo real.
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {session.status === "active" && !current && upcoming.length === 0 && (
        <Card padding="md">
          <p className="text-body-sm text-[var(--color-ink-muted)]">No quedan más cartas pendientes.</p>
          {isSeller && (
            <Button className="mt-3" onClick={() => handleAction(() => apiPost("/end"))}>
              Cerrar sesión
            </Button>
          )}
        </Card>
      )}

      {session.status === "draft" && (
        <Card padding="md">
          <p className="text-body-sm text-[var(--color-ink-muted)]">
            La sesión todavía no fue iniciada. Cuando el vendedor la inicie, las cartas aparecerán acá.
          </p>
        </Card>
      )}

      {session.status === "ended" && (
        <Card padding="md">
          <p className="font-semibold text-[var(--color-ink-subtle)]">Sesión terminada</p>
          <p className="text-body-sm text-[var(--color-ink-muted)]">
            Se claimaron {session.claimedCount ?? 0} carta{(session.claimedCount ?? 0) !== 1 ? "s" : ""} en esta sesión.
          </p>
        </Card>
      )}

      {past.length > 0 && (
        <Card padding="lg">
          <h3 className="text-h3">Historial</h3>
          <ul className="mt-3 space-y-2">
            {past.map((card) => (
              <li
                key={card.id}
                className={`flex items-center gap-3 rounded-[var(--radius-input)] border p-3 ${
                  card.status === "claimed"
                    ? "border-[var(--color-success)] bg-[var(--color-success-soft)]"
                    : "border-[var(--color-border-default)]"
                }`}
              >
                {card.imageUrl && (
                  <Image
                    src={card.imageUrl}
                    alt={card.cardName}
                    width={32}
                    height={45}
                    className="h-8 w-auto rounded object-contain"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{card.cardName}</p>
                  <p className="text-caption text-[var(--color-ink-muted)]">
                    {card.status === "claimed"
                      ? `Claimada por @${card.claimedByHandle}`
                      : "Pasada"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-body-sm font-semibold">
                    {card.priceArs === 0 ? "FREE" : `ARS ${card.priceArs.toLocaleString("es-AR")}`}
                  </span>
                  {card.status === "claimed" && (
                    <CheckCircle className="h-4 w-4 text-[var(--color-success)]" />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
