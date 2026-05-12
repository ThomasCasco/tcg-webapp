import Link from "next/link";
import { listClaimSessions } from "@/lib/server/repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Layers } from "@/components/ui/icon";

export const dynamic = "force-dynamic";

export default async function ClaimsPage() {
  let active: Awaited<ReturnType<typeof listClaimSessions>> = [];
  let recent: Awaited<ReturnType<typeof listClaimSessions>> = [];

  if (isSupabaseConfigured()) {
    [active, recent] = await Promise.all([
      listClaimSessions({ status: ["active"] }).catch(() => []),
      listClaimSessions({ status: ["ended"] }).catch(() => []),
    ]);
    recent = recent.slice(0, 10);
  }

  return (
    <section className="space-y-5">
      <Card as="header" padding="lg">
        <p className="text-overline text-[var(--color-ink-subtle)]">Marketplace</p>
        <h1 className="mt-1 text-h1 [font-family:var(--font-display)]">Claims</h1>
        <p className="mt-2 text-body-sm text-[var(--color-ink-muted)]">
          Los vendedores revelan cartas de a una con precio fijo. El primero en clickear
          &quot;Claimar&quot; se la lleva. Las cartas free son gratis — solo coordinás el envío.
        </p>
      </Card>

      <Card padding="lg">
        <div className="flex items-center justify-between">
          <h2 className="text-h3">Sesiones activas</h2>
          <Chip variant="success">{active.length} en vivo</Chip>
        </div>

        {active.length === 0 ? (
          <EmptyState
            icon={<Layers className="h-8 w-8" />}
            title="No hay sesiones activas"
            description="Cuando un vendedor inicie una sesión de claims aparecerá acá."
            className="mt-4"
          />
        ) : (
          <ul className="mt-3 space-y-2">
            {active.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </ul>
        )}
      </Card>

      {recent.length > 0 && (
        <Card padding="lg">
          <h2 className="text-h3">Sesiones recientes</h2>
          <ul className="mt-3 space-y-2">
            {recent.map((session) => (
              <SessionCard key={session.id} session={session} ended />
            ))}
          </ul>
        </Card>
      )}
    </section>
  );
}

function SessionCard({
  session,
  ended = false,
}: {
  session: Awaited<ReturnType<typeof listClaimSessions>>[number];
  ended?: boolean;
}) {
  return (
    <li>
      <Link
        href={`/claims/${session.id}`}
        className="flex items-center justify-between rounded-[var(--r-sm)] border border-[var(--glass-border)] bg-[var(--glass-fill)] px-4 py-3 transition-colors hover:border-[var(--accent-hi)] hover:bg-[rgba(var(--accent-glow),0.15)]"
      >
        <div className="min-w-0">
          <p className="truncate font-semibold">{session.title}</p>
          <p className="text-caption text-[var(--color-ink-muted)]">@{session.sellerHandle}</p>
        </div>
        <div className="ml-3 flex shrink-0 flex-wrap gap-1">
          {ended ? (
            <Chip variant="info" size="sm">{session.claimedCount ?? 0} claimadas</Chip>
          ) : (
            <>
              <Chip variant="success" size="sm">En vivo</Chip>
              {(session.remainingCount ?? 0) > 0 && (
                <Chip size="sm">{session.remainingCount} restantes</Chip>
              )}
            </>
          )}
        </div>
      </Link>
    </li>
  );
}
