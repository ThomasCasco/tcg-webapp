import { redirect } from "next/navigation";
import Link from "next/link";
import { RegisterForm } from "@/components/register-form";
import { getAuthenticatedUser } from "@/lib/server/auth";

export default async function RegisterPage() {
  const user = await getAuthenticatedUser();
  if (user) {
    redirect("/inventory");
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-ink)] [font-family:var(--font-display)]">
          Crear cuenta
        </h1>
        <p className="mt-2 text-body text-[var(--color-ink-muted)]">
          Unite a la comunidad de coleccionistas
        </p>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-white p-6 shadow-sm md:p-8">
        <RegisterForm />
        
        <div className="mt-6 text-center">
          <p className="text-sm text-[var(--color-ink-muted)]">
            Ya tenes cuenta?{" "}
            <Link 
              href="/login" 
              className="font-semibold text-[var(--color-ink)] hover:underline"
            >
              Inicia sesion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
