import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { Card } from "@/components/ui/card";
import { Sparkles } from "@/components/ui/icon";

export default async function LoginPage() {
  const user = await getAuthenticatedUser();
  if (user) {
    redirect("/inventory");
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4 screen-in">
      <Card as="section" padding="lg" className="w-full max-w-md">
        <div className="grid h-12 w-12 place-items-center rounded-[var(--r-sm)] bg-[var(--accent)] text-white">
          <Sparkles className="h-5 w-5" />
        </div>
        <p className="mt-4 t-eyebrow">Acceso vendedor/comprador</p>
        <h1 className="mt-1 t-h1 text-[2rem]">Hola de nuevo</h1>
        <p className="mt-2 t-sm t-mute">
          Ingresá para ver tu inventario, publicaciones y operaciones.
        </p>

        <div className="mt-6">
          <LoginForm />
        </div>
      </Card>
    </div>
  );
}
