import Link from "next/link";
import { listSocialProfiles } from "@/lib/server/repository";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Search, Users } from "@/components/ui/icon";

export const dynamic = "force-dynamic";

export default async function ProfilesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  let profiles: Awaited<ReturnType<typeof listSocialProfiles>> = [];
  let loadError: string | null = null;

  try {
    profiles = await listSocialProfiles({ query: q, limit: 80 });
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Failed to load profiles.";
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-3 py-4 md:px-6 md:py-6">
      <header className="rounded-[var(--radius-card)] bg-[var(--color-surface-elevated)] p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-overline text-[var(--color-ink-subtle)]">Comunidad</p>
            <h1 className="mt-1 text-h1 [font-family:var(--font-display)]">Perfiles</h1>
            <p className="mt-2 max-w-2xl text-body-sm text-[var(--color-ink-muted)]">
              Encontrá coleccionistas por cartas, ciudad, juegos favoritos o actividad.
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/account">Completar mi perfil</Link>
          </Button>
        </div>

        <form method="GET" className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-subtle)]" />
            <Input
              name="q"
              defaultValue={q}
              placeholder="Buscar usuario, ciudad, carta favorita..."
              className="pl-9"
            />
          </div>
          <Button type="submit">Buscar</Button>
        </form>
      </header>

      {loadError ? (
        <Card padding="md" className="border-[var(--color-danger)] bg-[var(--color-danger-soft)]">
          <p className="text-body-sm text-[var(--color-danger)]">Error: {loadError}</p>
        </Card>
      ) : null}

      {profiles.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="Sin perfiles"
          description="Todavia no hay perfiles que coincidan con esa busqueda."
        />
      ) : (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {profiles.map((profile, index) => (
            <Card key={profile.userId} as="article" padding="md" className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar
                    name={profile.displayName ?? profile.username}
                    src={profile.avatarUrl}
                    size="lg"
                  />
                  <div className="min-w-0">
                    <h2 className="truncate text-h3">
                      {profile.displayName || `@${profile.username}`}
                    </h2>
                    <p className="truncate text-caption text-[var(--color-ink-muted)]">
                      @{profile.username}
                    </p>
                  </div>
                </div>
                {index < 3 ? <Chip variant="success" size="sm">Top {index + 1}</Chip> : null}
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-caption">
                  <span className="text-[var(--color-ink-muted)]">Perfil completo</span>
                  <strong>{profile.completionScore}%</strong>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                  <div
                    className="h-full rounded-full bg-[var(--color-accent)]"
                    style={{ width: `${profile.completionScore}%` }}
                  />
                </div>
              </div>

              {profile.bio ? (
                <p className="line-clamp-2 text-body-sm text-[var(--color-ink-muted)]">
                  {profile.bio}
                </p>
              ) : (
                <p className="text-body-sm text-[var(--color-ink-subtle)]">Sin bio todavia.</p>
              )}

              <div className="flex flex-wrap gap-2">
                {profile.location ? <Chip size="sm">{profile.location}</Chip> : null}
                {profile.favoriteGame ? <Chip size="sm">{profile.favoriteGame}</Chip> : null}
                {profile.favoriteCard ? <Chip size="sm">{profile.favoriteCard}</Chip> : null}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-[var(--color-surface)] p-2">
                  <p className="text-lg font-semibold">{profile.tradeCount}</p>
                  <p className="text-caption text-[var(--color-ink-muted)]">Trade</p>
                </div>
                <div className="rounded-lg bg-[var(--color-surface)] p-2">
                  <p className="text-lg font-semibold">{profile.wantedCount}</p>
                  <p className="text-caption text-[var(--color-ink-muted)]">Busca</p>
                </div>
                <div className="rounded-lg bg-[var(--color-surface)] p-2">
                  <p className="text-lg font-semibold">{profile.listingCount}</p>
                  <p className="text-caption text-[var(--color-ink-muted)]">Ventas</p>
                </div>
              </div>

              <Button asChild variant="secondary" fullWidth>
                <Link href={`/u/${profile.username}`}>Ver perfil</Link>
              </Button>
            </Card>
          ))}
        </section>
      )}
    </main>
  );
}
