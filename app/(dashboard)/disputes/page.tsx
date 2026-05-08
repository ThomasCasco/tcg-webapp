import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { listDisputesForUser } from "@/lib/server/repository";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Scale } from "@/components/ui/icon";

export const dynamic = "force-dynamic";

export default async function DisputesPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }

  let disputes = [] as Awaited<ReturnType<typeof listDisputesForUser>>;
  let loadError: string | null = null;

  try {
    disputes = await listDisputesForUser(user.id);
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Failed to load disputes.";
  }

  return (
    <section className="space-y-4">
      <Card as="header" padding="lg" className="border-[var(--color-border-strong)]">
        <p className="text-overline text-[var(--color-ink-subtle)]">Disputas</p>
        <h1 className="mt-1 text-h1 [font-family:var(--font-display)]">
          Centro de resolución
        </h1>
        <p className="mt-2 text-body-sm text-[var(--color-ink-muted)]">
          Para abrir una disputa, andá a{" "}
          <Link href="/transactions" className="underline">tus transacciones</Link>{" "}
          y tocá &quot;Abrir disputa&quot; en la operación afectada.
        </p>
      </Card>

      {loadError ? (
        <Card as="article" padding="md" className="notice-danger">
          <p className="text-body-sm">Error de backend: {loadError}</p>
        </Card>
      ) : null}

      {disputes.length === 0 && !loadError ? (
        <EmptyState
          icon={<Scale className="h-8 w-8" />}
          title="Sin disputas"
          description="No tenés disputas abiertas. Ojalá siga así."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {disputes.map((dispute) => (
            <Card as="article" key={dispute.id} padding="md">
              <p className="text-overline text-[var(--color-ink-subtle)]">{dispute.transactionId}</p>
              <p className="mt-1 font-semibold text-[var(--color-ink)]">{dispute.reason}</p>
              <p className="mt-1 text-body-sm text-[var(--color-ink-muted)]">{dispute.details}</p>
              <p className="mt-2 text-body-sm text-[var(--color-ink-muted)]">
                Abierta por: {dispute.openedByHandle}
              </p>
              <p className="text-body-sm text-[var(--color-ink-muted)]">Estado: {dispute.status}</p>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
