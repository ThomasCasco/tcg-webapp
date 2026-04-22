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
    <section className="surface-panel mx-auto w-full max-w-xl p-6 md:p-8">
      <p className="text-xs uppercase tracking-[0.15em] text-black/55">
        Onboarding vendedor
      </p>
      <h1 className="mt-2 text-4xl [font-family:var(--font-display)]">
        Crear cuenta
      </h1>
      <p className="mt-2 text-sm text-black/70">
        Registro real para empezar a cargar inventario y publicar cartas.
      </p>

      <RegisterForm />

      <p className="mt-5 text-sm text-black/70">
        Ya tenes cuenta?{" "}
        <Link href="/login" className="font-semibold text-[var(--color-accent)]">
          Iniciar sesion
        </Link>
      </p>
    </section>
  );
}