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
    <section className="surface-panel mx-auto w-full max-w-xl p-6 md:p-8">
      <p className="text-xs uppercase tracking-[0.15em] text-black/55">
        Acceso vendedor/comprador
      </p>
      <h1 className="mt-2 text-4xl [font-family:var(--font-display)]">Login</h1>
      <p className="mt-2 text-sm text-black/70">
        Inicia sesion para gestionar inventario, listings y transacciones.
      </p>

      <LoginForm />

      <p className="mt-5 text-sm text-black/70">
        No tenes cuenta?{" "}
        <Link href="/register" className="font-semibold text-[var(--color-accent)]">
          Registrate
        </Link>
      </p>
    </section>
  );
}