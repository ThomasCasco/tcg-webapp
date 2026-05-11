import { notFound } from "next/navigation";
import { getClaimSession } from "@/lib/server/repository";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { ClaimSessionView } from "@/components/claim-session-view";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ClaimSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [session, user] = await Promise.all([
    getClaimSession(id).catch(() => null),
    getAuthenticatedUser().catch(() => null),
  ]);

  if (!session) notFound();

  if (session.status === "draft" && session.sellerId !== user?.id) {
    return (
      <section className="space-y-5">
        <Card padding="lg">
          <h1 className="text-h1 [font-family:var(--font-display)]">{session.title}</h1>
          <p className="mt-2 text-body-sm text-[var(--color-ink-muted)]">
            Esta sesión todavía no fue iniciada por el vendedor.
          </p>
        </Card>
      </section>
    );
  }

  const isSeller = user?.id === session.sellerId;

  return (
    <section className="space-y-5">
      <ClaimSessionView
        session={session}
        isSeller={isSeller}
        viewerUserId={user?.id}
      />
    </section>
  );
}
