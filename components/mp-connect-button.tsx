"use client";
/**
 * MpConnectButton — lets sellers connect / disconnect their Mercado Pago account.
 *
 * Connected state: shows MP user ID + "Desconectar" (requires future disconnect endpoint).
 * Disconnected state: shows "Conectar Mercado Pago" which redirects to the OAuth flow.
 */

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { CheckCircle, AlertCircle, ExternalLink } from "@/components/ui/icon";

export type MpConnectStatus = "connected" | "disconnected" | "error";

type Props = {
  status: MpConnectStatus;
  mpUserId?: string;
  /** Optional override for the OAuth initiation URL. Defaults to /api/auth/mercadopago. */
  connectUrl?: string;
  /** Message to show after a redirect (from ?mp_connected or ?mp_error query param). */
  feedback?: string;
};

export function MpConnectButton({
  status,
  mpUserId,
  connectUrl = "/api/auth/mercadopago",
  feedback,
}: Props) {
  if (status === "connected") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-[var(--color-success)]" />
          <span className="text-body-sm font-medium text-[var(--color-success)]">
            Mercado Pago conectado
          </span>
          {mpUserId && (
            <Chip variant="success" size="sm">
              ID {mpUserId}
            </Chip>
          )}
        </div>
        <p className="text-caption text-[var(--color-ink-muted)]">
          Los compradores pueden pagarte automáticamente. La plataforma retiene el 1&nbsp;% de
          comisión sobre cada venta.
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-[var(--color-danger)]" />
          <span className="text-body-sm text-[var(--color-danger)]">
            Error al conectar Mercado Pago
          </span>
        </div>
        {feedback && (
          <p className="text-caption text-[var(--color-danger)]">{feedback}</p>
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            window.location.href = connectUrl;
          }}
        >
          <ExternalLink className="mr-1 h-4 w-4" />
          Reintentar conexión
        </Button>
      </div>
    );
  }

  // disconnected
  return (
    <div className="space-y-3">
      <p className="text-body-sm text-[var(--color-ink-muted)]">
        Conectá tu cuenta de Mercado Pago para recibir pagos automáticos de los compradores.
        La plataforma retiene el 1&nbsp;% de comisión sobre cada venta.
      </p>
      <Button
        variant="primary"
        size="md"
        onClick={() => {
          window.location.href = connectUrl;
        }}
      >
        <ExternalLink className="mr-1 h-4 w-4" />
        Conectar Mercado Pago
      </Button>
    </div>
  );
}
