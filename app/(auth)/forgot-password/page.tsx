import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { Card } from "@/components/ui/card";
import { KeyRound } from "@/components/ui/icon";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-4 screen-in">
      <Card as="section" padding="lg" className="w-full max-w-md">
        <div className="grid h-12 w-12 place-items-center rounded-[var(--r-sm)] bg-[var(--accent)] text-white">
          <KeyRound className="h-5 w-5" />
        </div>
        <p className="mt-4 t-eyebrow">Recuperar acceso</p>
        <h1 className="mt-1 t-h1 text-[2rem]">Cambiar contraseña</h1>
        <p className="mt-2 t-sm t-mute">
          Te enviamos un link seguro para crear una contraseña nueva.
        </p>

        <div className="mt-6">
          <ForgotPasswordForm />
        </div>
      </Card>
    </div>
  );
}
