import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { getMpConnectionStatus } from "@/lib/server/repository";

export const dynamic = "force-dynamic";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ mp_connected?: string; mp_error?: string }>;
}) {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login?next=/onboarding");

  const params = await searchParams;
  const { mpConnected } = await getMpConnectionStatus(user.id).catch(() => ({
    mpConnected: false,
  }));

  // Coming back from the Mercado Pago OAuth flow: resume on the right step.
  const initialStep = params.mp_connected === "1" ? 3 : params.mp_error ? 2 : 1;

  return (
    <OnboardingWizard
      initialStep={initialStep}
      mpConnected={mpConnected}
      mpError={params.mp_error ? "No se pudo conectar Mercado Pago. Probá de nuevo." : undefined}
    />
  );
}
