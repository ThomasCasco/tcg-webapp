import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/register-form";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { Card } from "@/components/ui/card";

export default async function RegisterPage() {
  const user = await getAuthenticatedUser();
  if (user) {
    redirect("/inventory");
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card as="section" className="w-full max-w-md">
        <p className="text-overline text-[var(--color-ink-subtle)]">
          Onboarding vendedor
        </p>
        <h1 className="mt-2 text-h1 [font-family:var(--font-display)]">
          Crear cuenta
        </h1>
        <p className="mt-2 text-body-sm text-[var(--color-ink-muted)]">
          Registrate para cargar tu inventario y publicar cartas.
        </p>

        <div className="mt-6">
          <RegisterForm />
        </div>
      </Card>
    </div>
  );
}
