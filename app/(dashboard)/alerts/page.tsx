import { redirect } from "next/navigation";
import { WatchlistManager } from "@/components/watchlist-manager";
import { NotificationsMarkReadOnMount } from "@/components/notifications-mark-read-on-mount";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { listNotificationsForUser } from "@/lib/server/repository";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Bell } from "@/components/ui/icon";

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
      <Card as="header" padding="lg" className="border-[var(--color-border-strong)]">
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
        <Card as="article" padding="md" className="notice-danger">
          <p className="text-body-sm">Error: {loadError}</p>
        </Card>
      ) : null}

      <Card padding="lg">
        <p className="text-overline text-[var(--color-ink-subtle)]">
          Notificaciones recientes
        </p>
        {notifications.length === 0 ? (
          <EmptyState
            icon={<Bell className="h-8 w-8" />}
            title="Sin notificaciones"
            description="Configurá alertas para empezar a recibirlas."
            className="mt-4"
          />
        ) : (
          <ul className="mt-3 space-y-2">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={`rounded-[var(--radius-card)] border p-3 ${
                  notification.readAt
                    ? "border-[var(--color-border-default)] bg-[var(--color-surface-elevated)]"
                    : "border-[var(--color-border-strong)] bg-[var(--color-surface)]"
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
