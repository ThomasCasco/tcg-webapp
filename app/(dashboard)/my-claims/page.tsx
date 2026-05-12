import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { listClaimSessions, listInventoryEntries } from "@/lib/server/repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { ClaimCreateForm } from "@/components/claim-create-form";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Layers } from "@/components/ui/icon";

export const dynamic = "force-dynamic";

export default async function MyClaimsPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  let sessions: Awaited<ReturnType<typeof listClaimSessions>> = [];
  let inventory: Awaited<ReturnType<typeof listInventoryEntries>> = [];
  let loadError: string | null = null;

  if (isSupabaseConfigured()) {
    try {
      [sessions, inventory] = await Promise.all([
        listClaimSessions({ sellerId: user.id }),
        listInventoryEntries({ ownerId: user.id }),
      ]);
    } catch (err) {
      loadError = err instanceof Error ? err.message : "Error al cargar.";
    }
  }

  const active = sessions.filter((s) => s.status === "active");
  const drafts = sessions.filter((s) => s.status === "draft");
  const ended = sessions.filter((s) => s.status === "ended");

  return (
    <section className="space-y-5">
      <Card as="header" padding="lg">
        <p className="text-overline text-[var(--color-ink-subtle)]">Vender</p>
        <h1 className="mt-1 text-h1 [font-family:var(--font-display)]">Mis Claims</h1>
        <p className="mt-2 text-body-sm text-[var(--color-ink-muted)]">
          Creá sesiones de claims para revelar cartas de a una. El primer comprador en reaccionar
          se la lleva al precio que fijaste. Ideal para liquidar cartas rápido o regalar extras.
        </p>
      </Card>

      {!isSupabaseConfigured() && (
        <Card padding="md" className="border-amber-300 bg-amber-50">
          <p className="text-sm text-amber-900">Configurá Supabase para usar claims.</p>
        </Card>
      )}

      {loadError && (
        <Card padding="md" className="border-rose-300 bg-rose-50">
          <p className="text-sm text-rose-900">Error: {loadError}</p>
        </Card>
      )}

      <ClaimCreateForm inventory={inventory} />

      {active.length > 0 && (
        <Card padding="lg">
          <div className="flex items-center justify-between">
            <h2 className="text-h3">En vivo</h2>
            <Chip variant="success">{active.length}</Chip>
          </div>
          <ul className="mt-3 space-y-2">
            {active.map((s) => (
              <SessionRow key={s.id} session={s} />
            ))}
          </ul>
        </Card>
      )}

      {drafts.length > 0 && (
        <Card padding="lg">
          <div className="flex items-center justify-between">
            <h2 className="text-h3">Borradores</h2>
            <Chip>{drafts.length}</Chip>
          </div>
          <ul className="mt-3 space-y-2">
            {drafts.map((s) => (
              <SessionRow key={s.id} session={s} />
            ))}
          </ul>
        </Card>
      )}

      {active.length === 0 && drafts.length === 0 && (
        <Card padding="lg">
          <EmptyState
            image="/img/empty-states/claims-empty.png"
            imageAlt="Sobre con carta"
            title="Sin sesiones activas"
            description="Creá una sesión arriba y revelá cartas de a una para tus compradores."
          />
        </Card>
      )}

      {ended.length > 0 && (
        <Card padding="lg">
          <div className="flex items-center justify-between">
            <h2 className="text-h3">Historial</h2>
            <Chip variant="info">{ended.length}</Chip>
          </div>
          <ul className="mt-3 space-y-2">
            {ended.map((s) => (
              <SessionRow key={s.id} session={s} ended />
            ))}
          </ul>
        </Card>
      )}
    </section>
  );
}

function SessionRow({
  session,
  ended = false,
}: {
  session: Awaited<ReturnType<typeof listClaimSessions>>[number];
  ended?: boolean;
}) {
  return (
    <li>
      <Link
        href={`/my-claims/${session.id}`}
        className="flex items-center justify-between rounded-[var(--r-sm)] border border-[var(--glass-border)] bg-[var(--glass-fill)] px-4 py-3 transition-colors hover:border-[var(--accent-hi)] hover:bg-[rgba(var(--accent-glow),0.15)]"
      >
        <div className="min-w-0">
          <p className="truncate font-semibold">{session.title}</p>
          <p className="text-caption text-[var(--color-ink-muted)]">
            {(session.cards?.length ?? 0)} cartas · {session.claimedCount ?? 0} claimadas
          </p>
        </div>
        <div className="ml-3 flex shrink-0 flex-wrap gap-1">
          {ended ? (
            <Chip variant="info" size="sm">Terminada</Chip>
          ) : session.status === "active" ? (
            <Chip variant="success" size="sm">En vivo</Chip>
          ) : (
            <Chip size="sm">Borrador</Chip>
          )}
          {!ended && (session.remainingCount ?? 0) > 0 && (
            <Chip size="sm">{session.remainingCount} restantes</Chip>
          )}
        </div>
      </Link>
    </li>
  );
}
