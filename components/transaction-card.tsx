import Link from "next/link";
import type { PaymentEventWithListing } from "@/lib/domain/types";
import { TransactionChat } from "@/components/transaction-chat";
import {
  fulfillmentLabelEs,
  verificationLabelEs,
} from "@/lib/shared/fulfillment-labels";

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
    <article className="surface-panel p-5 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-black/55">
            {isBuyer ? "Compraste" : "Te compraron"}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-black/90">{title}</h3>
          {transaction.listingSetName ? (
            <p className="text-xs text-black/60">{transaction.listingSetName}</p>
          ) : null}
          {transaction.listingSellerHandle ? (
            <p className="mt-1 text-xs text-black/60">
              Vendedor: <strong>{transaction.listingSellerHandle}</strong>
            </p>
          ) : null}
        </div>
        <span className="rounded-full bg-black/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-black/60">
          {transaction.transactionId}
        </span>
      </div>

      <div className="mt-3 grid gap-2 rounded-xl border border-[var(--color-border)] bg-white/60 p-3 text-xs">
        <p>
          <span className="text-black/55">Comprador:</span>{" "}
          <strong>{transaction.buyerHandle}</strong>
        </p>
        <p>
          <span className="text-black/55">Verificación del pago:</span>{" "}
          <strong>
            {verificationLabelEs[transaction.verificationStatus] ??
              transaction.verificationStatus}
          </strong>
        </p>
        {transaction.providerPaymentId ? (
          <p>
            <span className="text-black/55">ID en proveedor:</span>{" "}
            <code className="rounded bg-black/5 px-1">{transaction.providerPaymentId}</code>{" "}
            <span className="text-black/50">({transaction.provider})</span>
          </p>
        ) : null}
        <p>
          <span className="text-black/55">Entrega / post-venta:</span>{" "}
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
        <div className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/80 p-3 text-xs text-black/80">
          <p className="font-semibold text-amber-950/90">Logística de la publicación</p>
          <p className="mt-1">
            {transaction.offersPickup ? "· Retiro " : ""}
            {transaction.offersShipping ? "· Envío " : ""}
          </p>
          {transaction.deliveryAreaNotes ? (
            <p className="mt-2 whitespace-pre-wrap">{transaction.deliveryAreaNotes}</p>
          ) : null}
        </div>
      ) : null}

      <p className="mt-3 text-[11px] text-black/55">
        Última comprobación registrada:{" "}
        {new Date(transaction.checkedAt).toLocaleString("es-AR")}
      </p>

      <p className="mt-3 text-xs text-black/60">
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
        className="mt-2 inline-block text-xs font-semibold text-[var(--color-accent-strong)] underline"
      >
        Volver al mercado
      </Link>
    </article>
  );
}
