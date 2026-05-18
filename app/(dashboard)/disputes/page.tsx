import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { listDisputesForUser } from "@/lib/server/repository";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowRight, Scale } from "@/components/ui/icon";

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
      <Card as="header" padding="lg">
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
        <Card as="article" padding="md" className="border-rose-300 bg-rose-50">
          <p className="text-sm text-rose-900">Error de backend: {loadError}</p>
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
            <Link key={dispute.id} href={`/disputes/${dispute.id}`} className="block">
              <Card as="article" variant="interactive" padding="md" className="h-full">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-overline text-[var(--color-ink-subtle)]">
                      {dispute.transactionId}
                    </p>
                    <p className="mt-1 font-semibold text-[var(--color-ink)]">{dispute.reason}</p>
                  </div>
                  <Chip size="sm" variant={dispute.status === "open" ? "warning" : "info"}>
                    {dispute.status}
                  </Chip>
                </div>
                <p className="mt-2 line-clamp-3 text-body-sm text-[var(--color-ink-muted)]">
                  {dispute.details}
                </p>
                <p className="mt-3 flex items-center justify-between text-body-sm font-semibold text-[var(--color-accent-strong)]">
                  <span>Ver caso</span>
                  <ArrowRight className="h-4 w-4" />
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
