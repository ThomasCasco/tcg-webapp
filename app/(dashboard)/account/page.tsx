import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { getMpConnectionStatus, getSocialProfile } from "@/lib/server/repository";
import { SocialProfileForm } from "@/components/social-profile-form";
import { MpConnectButton } from "@/components/mp-connect-button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Wallet } from "@/components/ui/icon";

export const dynamic = "force-dynamic";

type SearchParams = { mp_connected?: string; mp_error?: string };

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  const params = await searchParams;

  let mpStatus: "connected" | "disconnected" | "error" = "disconnected";
  let mpUserId: string | null = null;
  let mpFeedback: string | undefined;

  // Query param feedback from OAuth redirect
  if (params.mp_connected === "1") {
    mpStatus = "connected";
  } else if (params.mp_error) {
    mpStatus = "error";
    // Fixed copy: never echo query-string text into the page.
    mpFeedback = "No se pudo conectar Mercado Pago. Probá de nuevo.";
  }

  // Override with DB state (source of truth)
  try {
    const conn = await getMpConnectionStatus(user.id);
    if (conn.mpConnected) {
      mpStatus = "connected";
      mpUserId = conn.mpUserId;
    } else if (mpStatus === "connected") {
      // DB says not connected but query param says yes — show connected state
      // (trigger may not have run yet; optimistic UI)
    }
  } catch {
    // Non-fatal — show UI based on query param only
  }

  let socialProfile: Awaited<ReturnType<typeof getSocialProfile>> | null = null;
  let profileError: string | null = null;

  try {
    socialProfile = await getSocialProfile(user.id);
  } catch {
    profileError = "No pudimos cargar tu perfil. Recargá la página.";
  }

  return (
    <section className="space-y-4">
      {/* ── Header ── */}
      <Card as="header" padding="lg">
        <p className="text-overline text-[var(--color-ink-subtle)]">Cuenta</p>
        <h1 className="mt-1 text-h1 [font-family:var(--font-display)]">
          Mi cuenta
        </h1>
        <p className="mt-2 text-body-sm text-[var(--color-ink-muted)]">
          Gestioná tu perfil de cobro y la conexión con Mercado Pago.
        </p>
      </Card>

      {/* ── Mercado Pago ── */}
      {profileError ? (
        <Card as="article" padding="md" className="border-rose-300 bg-rose-50">
          <p className="text-sm text-rose-900">Error: {profileError}</p>
        </Card>
      ) : null}

      {socialProfile ? <SocialProfileForm initialProfile={socialProfile} /> : null}

      <Card padding="lg">
        <div className="mb-4 flex items-center gap-2">
          <Wallet className="h-5 w-5 text-[var(--color-accent-strong)]" />
          <h2 className="text-h2">Cobros automáticos</h2>
          {mpStatus === "connected" && (
            <Chip variant="success" size="sm">Activo</Chip>
          )}
        </div>

        <MpConnectButton
          status={mpStatus}
          mpUserId={mpUserId ?? undefined}
          feedback={mpFeedback}
        />
      </Card>

      {/* ── Account info ── */}
      <Card padding="lg">
        <h2 className="mb-3 text-h2">Información de cuenta</h2>
        <dl className="space-y-2 text-body-sm">
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 text-[var(--color-ink-subtle)]">Handle:</dt>
            <dd className="font-medium">@{user.username}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 text-[var(--color-ink-subtle)]">Email:</dt>
            <dd>{user.email}</dd>
          </div>
        </dl>
      </Card>
    </section>
  );
}
