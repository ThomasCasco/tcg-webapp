import { redirect } from "next/navigation";
import { WatchlistManager } from "@/components/watchlist-manager";
import { getAuthenticatedUser } from "@/lib/server/auth";
import {
  listNotificationsForUser,
} from "@/lib/server/repository";

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

  return (
    <section className="space-y-6">
      <div className="surface-panel p-5">
        <p className="text-xs uppercase tracking-[0.12em] text-black/55">
          Alertas de cartas
        </p>
        <h1 className="mt-1 text-3xl [font-family:var(--font-display)]">
          Te avisamos cuando aparezca lo que queres
        </h1>
        <p className="mt-2 text-sm text-black/70">
          Cargá nombres de cartas (ej: &quot;charizard&quot;, &quot;mew ex&quot;) y cuando un
          vendedor publique algo que matchee, vas a ver una notificacion.
        </p>
      </div>

      <WatchlistManager />

      {loadError ? (
        <article className="surface-panel border-2 border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">
          Error: {loadError}
        </article>
      ) : null}

      <div className="surface-panel p-5">
        <p className="text-xs uppercase tracking-[0.12em] text-black/55">
          Notificaciones recientes
        </p>
        {notifications.length === 0 ? (
          <p className="mt-3 text-sm text-black/60">
            Todavia no tenes notificaciones. Configura alertas para empezar a recibirlas.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={`rounded-xl border border-[var(--color-border)] p-3 ${
                  notification.readAt ? "bg-white/60" : "bg-[#fff4e0]"
                }`}
              >
                <p className="text-sm font-semibold">{notification.title}</p>
                <p className="text-xs text-black/70">{notification.body}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-black/45">
                  {new Date(notification.createdAt).toLocaleString("es-AR")}
                  {notification.readAt ? " · leida" : " · nueva"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
