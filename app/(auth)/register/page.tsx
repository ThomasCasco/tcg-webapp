import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/register-form";
import { getAuthenticatedUser } from "@/lib/server/auth";

export default async function RegisterPage() {
  const user = await getAuthenticatedUser();
  if (user) {
    redirect("/inventory");
  }

  return (
    <section className="card mx-auto w-full max-w-md p-7 md:p-8">
      <h1 className="text-3xl font-bold tracking-tight">Crear cuenta</h1>
      <p className="mt-2 text-sm muted">
        Registrate gratis para cargar tu inventario y empezar a publicar.
      </p>

      <RegisterForm />

      <p className="mt-6 text-sm muted">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-strong)]">
          Iniciar sesión
        </Link>
      </p>
    </section>
  );
}
