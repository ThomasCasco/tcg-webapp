import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/register-form";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { Card } from "@/components/ui/card";
import { Check, Sparkles } from "@/components/ui/icon";

const BENEFITS = [
  "Cargá tu inventario en minutos",
  "Vendé en pesos con Mercado Pago",
  "Coordiná trades con la comunidad",
];

export default async function RegisterPage() {
  const user = await getAuthenticatedUser();
  if (user) {
    redirect("/inventory");
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4 screen-in">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_minmax(0,420px)]">
        <aside className="glass hidden flex-col justify-between p-8 lg:flex">
          <div>
            <div className="grid h-12 w-12 place-items-center rounded-[var(--r-sm)] bg-[var(--accent)] text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="mt-8 t-eyebrow">Sumate al mercado</p>
            <h2 className="mt-2 t-h1 text-[2rem]">
              Cartas reales, mercado local, liquidez simple.
            </h2>
            <p className="mt-3 max-w-sm t-sm t-mute">
              Pokémon TCG en pesos, con vendedores verificables y trades entre
              coleccionistas.
            </p>
          </div>
          <ul className="mt-10 space-y-3">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-2 t-sm text-[var(--ink)]">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-hi)]" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </aside>

        <Card as="section" padding="lg" className="w-full">
          <div className="grid h-12 w-12 place-items-center rounded-[var(--r-sm)] bg-[var(--accent)] text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <p className="mt-4 t-eyebrow">Onboarding vendedor</p>
          <h1 className="mt-1 t-h1 text-[2rem]">Creá tu cuenta</h1>
          <p className="mt-2 t-sm t-mute">
            Empezá a vender, comprar y tradear cartas reales.
          </p>

          <div className="mt-6">
            <RegisterForm />
          </div>
        </Card>
      </div>
    </div>
  );
}
