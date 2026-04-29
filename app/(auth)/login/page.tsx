import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getAuthenticatedUser } from "@/lib/server/auth";

export default async function LoginPage() {
  const user = await getAuthenticatedUser();
  if (user) {
    redirect("/inventory");
  }

  return (
    <section className="card mx-auto w-full max-w-md p-7 md:p-8">
      <h1 className="text-3xl font-bold tracking-tight">Ingresar</h1>
      <p className="mt-2 text-sm muted">
        Accedé a tu inventario, publicaciones y operaciones.
      </p>

      <LoginForm />

      <p className="mt-6 text-sm muted">
        ¿Todavía no tenés cuenta?{" "}
        <Link href="/register" className="font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-strong)]">
          Crear cuenta
        </Link>
      </p>
    </section>
  );
}
