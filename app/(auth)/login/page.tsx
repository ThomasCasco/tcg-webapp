import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { Card } from "@/components/ui/card";

export default async function LoginPage() {
  const user = await getAuthenticatedUser();
  if (user) {
    redirect("/inventory");
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card as="section" className="w-full max-w-md">
        <p className="text-overline text-[var(--color-ink-subtle)]">
          Acceso vendedor/comprador
        </p>
        <h1 className="mt-2 text-h1 [font-family:var(--font-display)]">Iniciar sesión</h1>
        <p className="mt-2 text-body-sm text-[var(--color-ink-muted)]">
          Gestioná tu inventario, publicaciones y transacciones.
        </p>

        <div className="mt-6">
          <LoginForm />
        </div>
      </Card>
    </div>
  );
}
