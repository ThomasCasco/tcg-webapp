import Link from "next/link";
import { redirect } from "next/navigation";
import { TransactionCard } from "@/components/transaction-card";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { listTransactionsForUser } from "@/lib/server/repository";
import type {
  FulfillmentStatus,
  PaymentEventWithListing,
  PaymentVerificationStatus,
} from "@/lib/domain/types";
import {
  fulfillmentLabelEs,
  verificationLabelEs,
} from "@/lib/shared/fulfillment-labels";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowLeftRight, Search } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

export const dynamic = "force-dynamic";

const roleOptions = ["all", "buyer", "seller"] as const;
const paymentOptions = ["all", "verified", "pending_review"] as const;
const fulfillmentOptions: Array<"all" | FulfillmentStatus> = [
  "all",
  "pending",
  "seller_confirmed",
  "shipped",
  "delivered",
  "disputed",
  "closed",
];

type RoleFilter = (typeof roleOptions)[number];
type PaymentFilter = (typeof paymentOptions)[number];
type FulfillmentFilter = (typeof fulfillmentOptions)[number];

function parseRole(value?: string): RoleFilter {
  return roleOptions.includes(value as RoleFilter) ? (value as RoleFilter) : "all";
}

function parsePayment(value?: string): PaymentFilter {
  return paymentOptions.includes(value as PaymentFilter)
    ? (value as PaymentFilter)
    : "all";
}

function parseFulfillment(value?: string): FulfillmentFilter {
  return fulfillmentOptions.includes(value as FulfillmentFilter)
    ? (value as FulfillmentFilter)
    : "all";
}

function matchesQuery(transaction: PaymentEventWithListing, query: string) {
  if (!query) return true;
  const haystack = [
    transaction.listingCardName,
    transaction.listingSetName,
    transaction.listingSellerHandle,
    transaction.buyerHandle,
    transaction.transactionId,
    transaction.providerPaymentId,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    role?: string;
    payment?: string;
    fulfillment?: string;
    q?: string;
  }>;
}) {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }

  const {
    role: rawRole = "all",
    payment: rawPayment = "all",
    fulfillment: rawFulfillment = "all",
    q = "",
  } = await searchParams;

  const role = parseRole(rawRole);
  const payment = parsePayment(rawPayment);
  const fulfillment = parseFulfillment(rawFulfillment);
  const query = q.trim().toLowerCase();

  let transactions = [] as Awaited<ReturnType<typeof listTransactionsForUser>>;
  let loadError: string | null = null;

  try {
    transactions = await listTransactionsForUser(user.id);
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Failed to load transactions.";
  }

  const totalTransactions = transactions.length;
  const filteredTransactions = transactions.filter((transaction) => {
    const isBuyer = transaction.buyerId === user.id;
    const roleMatch =
      role === "all" ||
      (role === "buyer" && isBuyer) ||
      (role === "seller" && !isBuyer);
    const paymentMatch =
      payment === "all" || transaction.verificationStatus === payment;
    const fulfillmentMatch =
      fulfillment === "all" ||
      (transaction.fulfillmentStatus ?? "pending") === fulfillment;

    return (
      roleMatch &&
      paymentMatch &&
      fulfillmentMatch &&
      matchesQuery(transaction, query)
    );
  });

  const activeFilters =
    role !== "all" || payment !== "all" || fulfillment !== "all" || query.length > 0;

  const verifiedCount = transactions.filter(
    (transaction) => transaction.verificationStatus === "verified",
  ).length;
  const pendingCount = transactions.filter(
    (transaction) => transaction.verificationStatus === "pending_review",
  ).length;

  return (
    <section className="space-y-4">
      <Card as="header" padding="lg" className="border-[var(--color-border-strong)]">
        <p className="text-overline text-[var(--color-ink-subtle)]">Transacciones</p>
        <h1 className="mt-1 text-h1 [font-family:var(--font-display)]">
          Tus compras y ventas
        </h1>
        <p className="mt-2 text-body-sm text-[var(--color-ink-muted)]">
          Aca ves el estado de cada operacion. El pago se confirma por Mercado Pago
          cuando corresponde; despues se coordina envio, retiro o recepcion.
        </p>
      </Card>

      {loadError && (
        <Card as="article" padding="md" className="border-[var(--color-danger)] bg-[var(--color-danger-soft)]">
          <p className="text-body-sm text-[var(--color-danger)]">Error: {loadError}</p>
        </Card>
      )}

      <Card padding="md">
        <form method="GET" className="grid gap-3 lg:grid-cols-[1.2fr,0.8fr,0.9fr,1fr,auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-subtle)]" />
            <Input
              name="q"
              defaultValue={q}
              placeholder="Buscar carta, usuario, operacion..."
              className="pl-9"
            />
          </div>
          <Select name="role" defaultValue={role} aria-label="Tipo de operacion">
            <option value="all">Todas</option>
            <option value="buyer">Compras</option>
            <option value="seller">Ventas</option>
          </Select>
          <Select name="payment" defaultValue={payment} aria-label="Estado de pago">
            <option value="all">Todos los pagos</option>
            {paymentOptions
              .filter((value): value is PaymentVerificationStatus => value !== "all")
              .map((value) => (
                <option key={value} value={value}>
                  {verificationLabelEs[value]}
                </option>
              ))}
          </Select>
          <Select name="fulfillment" defaultValue={fulfillment} aria-label="Estado de entrega">
            <option value="all">Toda entrega</option>
            {fulfillmentOptions
              .filter((value): value is FulfillmentStatus => value !== "all")
              .map((value) => (
                <option key={value} value={value}>
                  {fulfillmentLabelEs[value]}
                </option>
              ))}
          </Select>
          <Button type="submit">Filtrar</Button>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-caption text-[var(--color-ink-muted)]">
          <span>{filteredTransactions.length} de {totalTransactions} operaciones</span>
          <span>Pago verificado: {verifiedCount}</span>
          <span>Pendientes: {pendingCount}</span>
          {activeFilters ? (
            <Link href="/transactions" className="ml-auto font-semibold text-[var(--color-accent-strong)] hover:underline">
              Limpiar filtros
            </Link>
          ) : null}
        </div>
      </Card>

      {transactions.length === 0 ? (
        <EmptyState
          icon={<ArrowLeftRight className="h-8 w-8" />}
          title="Sin transacciones"
          description="Todavia no tenes compras ni ventas. Busca cartas en el Mercado para empezar."
        />
      ) : filteredTransactions.length === 0 ? (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title="Sin resultados"
          description="No hay operaciones que coincidan con esos filtros."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredTransactions.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              viewerUserId={user.id}
            />
          ))}
        </div>
      )}
    </section>
  );
}
