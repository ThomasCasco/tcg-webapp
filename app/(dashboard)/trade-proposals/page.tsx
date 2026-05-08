import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { listTradeProposalsForUser } from "@/lib/server/repository";
import { TradeProposalsManager } from "@/components/trade-proposals-manager";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowLeftRight } from "@/components/ui/icon";

export const dynamic = "force-dynamic";

export default async function TradeProposalsPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  let proposals: Awaited<ReturnType<typeof listTradeProposalsForUser>> = [];
  let loadError: string | null = null;
  try {
    proposals = await listTradeProposalsForUser(user.id);
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Failed to load trade proposals.";
  }

  return (
    <section className="space-y-4">
      <Card as="header" padding="lg" className="border-[var(--color-border-strong)]">
        <p className="text-overline text-[var(--color-ink-subtle)]">Trades</p>
        <h1 className="mt-1 text-h1 [font-family:var(--font-display)]">
          Propuestas de trade
        </h1>
        <p className="mt-2 text-body-sm text-[var(--color-ink-muted)]">
          Revisa propuestas recibidas y enviadas desde perfiles publicos.
        </p>
      </Card>

      {loadError ? (
        <Card padding="md" className="notice-danger">
          <p className="text-body-sm">Error: {loadError}</p>
        </Card>
      ) : null}

      {proposals.length === 0 ? (
        <EmptyState
          icon={<ArrowLeftRight className="h-8 w-8" />}
          title="Sin propuestas"
          description="Cuando alguien te proponga un intercambio, va a aparecer aca."
        />
      ) : (
        <TradeProposalsManager proposals={proposals} currentUserId={user.id} />
      )}
    </section>
  );
}
