"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AuctionListing } from "@/lib/domain/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";

export function AuctionManager({
  auctions,
}: {
  auctions: AuctionListing[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function close(id: string) {
    setBusyId(id);
    try {
      const response = await fetch("/api/auctions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "close" }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "No se pudo cerrar.");
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {auctions.map((auction) => {
        return (
          <Card key={auction.id} as="article" padding="md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-h3">{auction.cardName}</h2>
                <p className="text-caption text-[var(--color-ink-muted)]">
                  ARS {auction.currentPriceArs.toLocaleString("es-AR")} · {auction.bidCount} ofertas
                </p>
              </div>
              <Chip variant={auction.status === "active" ? "success" : "default"}>
                {auction.status}
              </Chip>
            </div>
            <p className="mt-2 text-body-sm text-[var(--color-ink-muted)]">
              Cierra: {new Date(auction.endsAt).toLocaleString("es-AR")}
            </p>
            {auction.winnerHandle ? (
              <p className="mt-2 rounded-lg bg-[var(--color-success-soft)] p-2 text-body-sm text-[var(--color-success)]">
                Ganador actual: @{auction.winnerHandle}
              </p>
            ) : null}
            {auction.status === "active" ? (
              <Button
                size="sm"
                variant="secondary"
                className="mt-3"
                onClick={() => close(auction.id)}
                loading={busyId === auction.id}
              >
                Cerrar y adjudicar
              </Button>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
