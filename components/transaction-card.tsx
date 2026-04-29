import Link from "next/link";
import type { PaymentEventWithListing } from "@/lib/domain/types";
import { TransactionChat } from "@/components/transaction-chat";
import {
  fulfillmentLabelEs,
  verificationLabelEs,
} from "@/lib/shared/fulfillment-labels";
import { Card } from "@/components/ui/card";

type Props = {
  transaction: PaymentEventWithListing;
  viewerUserId: string;
};

export function TransactionCard({ transaction, viewerUserId }: Props) {
  const isBuyer = transaction.buyerId === viewerUserId;
  const title =
    transaction.listingCardName ??
    `Publicación ${transaction.listingId.slice(0, 8)}…`;

  return (
    <Card as="article" padding="md">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-overline text-[var(--color-ink-subtle)]">
            {isBuyer ? "Compraste" : "Te compraron"}
          </p>
          <h3 className="mt-1 text-h3">{title}</h3>
          {transaction.listingSetName ? (
            <p className="text-caption text-[var(--color-ink-muted)]">{transaction.listingSetName}</p>
          ) : null}
          {transaction.listingSellerHandle ? (
            <p className="mt-1 text-caption text-[var(--color-ink-muted)]">
              Vendedor: <strong>{transaction.listingSellerHandle}</strong>
            </p>
          ) : null}
        </div>
        <span className="rounded-full bg-black/5 px-2 py-1 text-caption font-semibold text-[var(--color-ink-subtle)]">
          {transaction.transactionId}
        </span>
      </div>

      <div className="mt-3 grid gap-2 rounded-xl border border-[var(--color-border)] bg-white/60 p-3 text-caption">
        <p>
          <span className="text-[var(--color-ink-subtle)]">Comprador:</span>{" "}
          <strong>{transaction.buyerHandle}</strong>
        </p>
        <p>
          <span className="text-[var(--color-ink-subtle)]">Verificación del pago:</span>{" "}
          <strong>
            {verificationLabelEs[transaction.verificationStatus] ??
              transaction.verificationStatus}
          </strong>
        </p>
        {transaction.providerPaymentId ? (
          <p>
            <span className="text-[var(--color-ink-subtle)]">ID en proveedor:</span>{" "}
            <code className="rounded bg-black/5 px-1">{transaction.providerPaymentId}</code>{" "}
            <span className="text-[var(--color-ink-subtle)]">({transaction.provider})</span>
          </p>
        ) : null}
        <p>
          <span className="text-[var(--color-ink-subtle)]">Entrega / post-venta:</span>{" "}
          <strong>
            {transaction.fulfillmentStatus
              ? (fulfillmentLabelEs[transaction.fulfillmentStatus] ??
                transaction.fulfillmentStatus)
              : "—"}
          </strong>
        </p>
      </div>

      {(transaction.offersPickup ||
        transaction.offersShipping ||
        transaction.deliveryAreaNotes) ? (
        <div className="mt-3 rounded-xl border border-amber-200/80 bg-[var(--color-warning-soft)] p-3 text-caption text-[var(--color-ink)]">
          <p className="font-semibold">Logística de la publicación</p>
          <p className="mt-1">
            {transaction.offersPickup ? "· Retiro " : ""}
            {transaction.offersShipping ? "· Envío " : ""}
          </p>
          {transaction.deliveryAreaNotes ? (
            <p className="mt-2 whitespace-pre-wrap">{transaction.deliveryAreaNotes}</p>
          ) : null}
        </div>
      ) : null}

      <p className="mt-3 text-caption text-[var(--color-ink-subtle)]">
        Última comprobación registrada:{" "}
        {new Date(transaction.checkedAt).toLocaleString("es-AR")}
      </p>

      <p className="mt-3 text-body-sm text-[var(--color-ink-muted)]">
        ¿Todavía no verificaste el pago? Usá el formulario de arriba con este{" "}
        <strong>transaction ID</strong>. Después seguí el envío o retiro según lo acordado.
      </p>

      <TransactionChat
        key={transaction.transactionId}
        transactionId={transaction.transactionId}
        viewerUserId={viewerUserId}
      />

      <Link
        href="/market"
        className="mt-2 inline-block text-body-sm font-semibold text-[var(--color-accent-strong)] underline"
      >
        Volver al mercado
      </Link>
    </Card>
  );
}
