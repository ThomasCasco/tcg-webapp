import { redirect } from "next/navigation";
import { WatchlistManager } from "@/components/watchlist-manager";
import { NotificationsMarkReadOnMount } from "@/components/notifications-mark-read-on-mount";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { listNotificationsForUser } from "@/lib/server/repository";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  let notifications: Awaited<ReturnType<typeof listNotificationsForUser>> = [];
  let loadError: string | null = null;
  try {
    notifications = await listNotificationsForUser(user.id, { limit: 30 });
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : "Failed to load notifications.";
  }

  const unreadIds = notifications.filter((n) => !n.readAt).map((n) => n.id);

  return (
    <section className="space-y-6">
      <NotificationsMarkReadOnMount ids={unreadIds} />
      <Card as="header" padding="lg">
        <p className="text-overline text-[var(--color-ink-subtle)]">
          Alertas de cartas
        </p>
        <h1 className="mt-1 text-h1 [font-family:var(--font-display)]">
          Te avisamos cuando aparezca lo que querés
        </h1>
        <p className="mt-2 text-body-sm text-[var(--color-ink-muted)]">
          Cargá nombres de cartas (ej: &quot;charizard&quot;, &quot;mew ex&quot;) y cuando un
          vendedor publique algo que matchee, vas a ver una notificación.
        </p>
      </Card>

      <WatchlistManager />

      {loadError ? (
        <Card as="article" padding="md" className="border-rose-300 bg-rose-50">
          <p className="text-sm text-rose-900">Error: {loadError}</p>
        </Card>
      ) : null}

      <Card padding="lg">
        <p className="text-overline text-[var(--color-ink-subtle)]">
          Notificaciones recientes
        </p>
        {notifications.length === 0 ? (
          <EmptyState
            image="/img/empty-states/alerts-empty.png"
            imageAlt="Campana sin notificaciones"
            title="Sin notificaciones"
            description="Configurá alertas para empezar a recibirlas."
            className="mt-4"
          />
        ) : (
          <ul className="mt-3 space-y-2">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={`rounded-[var(--r-md)] border p-3 ${
                  notification.readAt
                    ? "border-[var(--glass-border)] bg-[var(--glass-fill)]"
                    : "border-[rgba(var(--accent-glow),0.3)] bg-[rgba(var(--accent-glow),0.12)]"
                }`}
              >
                <p className="text-body-sm font-semibold">{notification.title}</p>
                <p className="text-caption text-[var(--color-ink-muted)]">{notification.body}</p>
                <p className="mt-1 text-overline text-[var(--color-ink-subtle)]">
                  {new Date(notification.createdAt).toLocaleString("es-AR")}
                  {notification.readAt ? " · leída" : " · nueva"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}
