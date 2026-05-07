"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TradeProposal, TradeProposalStatus } from "@/lib/domain/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";

type Props = {
  proposals: TradeProposal[];
  currentUserId: string;
};

const statusLabel: Record<TradeProposalStatus, string> = {
  pending: "Pendiente",
  accepted: "Aceptada",
  completed: "Completada",
  declined: "Rechazada",
  cancelled: "Cancelada",
};

export function TradeProposalsManager({ proposals, currentUserId }: Props) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function update(id: string, status: TradeProposalStatus) {
    setBusyId(id);
    try {
      const response = await fetch("/api/trade-proposals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "No se pudo actualizar.");
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="grid gap-3">
      {proposals.map((proposal) => {
        const incoming = proposal.recipientId === currentUserId;
        const iConfirmed = incoming
          ? Boolean(proposal.recipientConfirmedAt)
          : Boolean(proposal.proposerConfirmedAt);
        const otherConfirmed = incoming
          ? Boolean(proposal.proposerConfirmedAt)
          : Boolean(proposal.recipientConfirmedAt);
        const pending = proposal.status === "pending";
        const accepted = proposal.status === "accepted";
        return (
          <Card key={proposal.id} as="article" padding="md">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-overline text-[var(--color-ink-subtle)]">
                  {incoming ? "Recibida" : "Enviada"}
                </p>
                <h2 className="text-h3">
                  @{proposal.proposerHandle} por @{proposal.recipientHandle}
                </h2>
              </div>
              <Chip variant={proposal.status === "accepted" || proposal.status === "completed" ? "success" : "default"}>
                {statusLabel[proposal.status]}
              </Chip>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg bg-[var(--color-surface)] p-3">
                <p className="text-caption font-semibold">Ofrece</p>
                <p className="text-body-sm text-[var(--color-ink-muted)]">
                  {proposal.offeredInventoryIds.length} carta(s)
                </p>
              </div>
              <div className="rounded-lg bg-[var(--color-surface)] p-3">
                <p className="text-caption font-semibold">Pide</p>
                <p className="text-body-sm text-[var(--color-ink-muted)]">
                  {proposal.requestedInventoryIds.length} carta(s)
                </p>
              </div>
            </div>

            {proposal.message ? (
              <p className="mt-3 rounded-lg bg-[var(--color-surface)] p-3 text-body-sm">
                {proposal.message}
              </p>
            ) : null}

            {pending ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {incoming ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => update(proposal.id, "accepted")}
                      loading={busyId === proposal.id}
                    >
                      Aceptar
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => update(proposal.id, "declined")}
                      disabled={busyId === proposal.id}
                    >
                      Rechazar
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => update(proposal.id, "cancelled")}
                    loading={busyId === proposal.id}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            ) : null}

            {accepted ? (
              <div className="mt-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                <p className="text-body-sm font-semibold text-[var(--color-ink)]">
                  Acuerdo aceptado, falta confirmar entrega fisica
                </p>
                <p className="mt-1 text-caption text-[var(--color-ink-muted)]">
                  No movemos cartas de inventario hasta que ambas partes confirmen que el trade se hizo.
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-caption">
                  <Chip variant={iConfirmed ? "success" : "default"} size="sm">
                    Vos: {iConfirmed ? "confirmado" : "pendiente"}
                  </Chip>
                  <Chip variant={otherConfirmed ? "success" : "default"} size="sm">
                    La otra parte: {otherConfirmed ? "confirmado" : "pendiente"}
                  </Chip>
                </div>
                {!iConfirmed ? (
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={() => update(proposal.id, "completed")}
                    loading={busyId === proposal.id}
                  >
                    Confirmar trade realizado
                  </Button>
                ) : null}
              </div>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
