import { notFound, redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { getClaimSession } from "@/lib/server/repository";
import { ClaimSessionView } from "@/components/claim-session-view";

export const dynamic = "force-dynamic";

export default async function MyClaimSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const session = await getClaimSession(id).catch(() => null);
  if (!session) notFound();
  if (session.sellerId !== user.id) notFound();

  return (
    <section className="space-y-5">
      <ClaimSessionView session={session} isSeller={true} viewerUserId={user.id} />
    </section>
  );
}
