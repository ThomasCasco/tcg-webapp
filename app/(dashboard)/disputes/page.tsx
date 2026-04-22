import { redirect } from "next/navigation";
import { DisputeCreateForm } from "@/components/dispute-create-form";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { listDisputesForUser } from "@/lib/server/repository";

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
      <DisputeCreateForm />

      {loadError ? (
        <article className="surface-panel border-2 border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">
          Error de backend: {loadError}
        </article>
      ) : null}

      <div className="surface-panel p-5">
        <p className="text-xs uppercase tracking-[0.12em] text-black/55">Disputas</p>
        <h1 className="mt-1 text-3xl [font-family:var(--font-display)]">Centro de resolucion</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {disputes.map((dispute) => (
          <article key={dispute.id} className="surface-panel p-5 text-sm">
            <p className="text-xs uppercase tracking-[0.12em] text-black/55">{dispute.transactionId}</p>
            <p className="mt-1 font-semibold">{dispute.reason}</p>
            <p className="mt-1 text-black/70">{dispute.details}</p>
            <p className="mt-2 text-black/70">Abierta por: {dispute.openedByHandle}</p>
            <p className="text-black/70">Estado: {dispute.status}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
