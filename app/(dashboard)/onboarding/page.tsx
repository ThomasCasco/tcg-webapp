"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, CheckCircle, Layers, ShoppingBag, Tag } from "@/components/ui/icon";

type Step = 1 | 2 | 3;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [paymentAlias, setPaymentAlias] = useState("");

  async function saveProfile() {
    const res = await fetch("/api/profile/social", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
        location: location.trim() || undefined,
      }),
    });
    if (!res.ok) {
      const data = await res.json() as { error?: string };
      throw new Error(data.error ?? "Error al guardar el perfil.");
    }
  }

  async function savePayment() {
    if (!paymentAlias.trim()) return;
    const res = await fetch("/api/profile/seller-payment", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentAlias: paymentAlias.trim(),
        paymentProvider: "bank_transfer",
      }),
    });
    if (!res.ok) {
      const data = await res.json() as { error?: string };
      throw new Error(data.error ?? "Error al guardar el método de pago.");
    }
  }

  async function completeOnboarding() {
    await fetch("/api/profile/onboarding", { method: "POST" });
  }

  async function handleStep1() {
    if (!displayName.trim()) {
      setError("Ingresá tu nombre visible.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await saveProfile();
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function handleStep2() {
    setLoading(true);
    setError(null);
    try {
      await savePayment();
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function handleFinish(destination: string) {
    setLoading(true);
    await completeOnboarding().catch(() => {});
    router.push(destination);
  }

  const progressPct = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <section className="mx-auto max-w-lg space-y-5 py-6">
      <div>
        <div className="mb-1 flex items-center justify-between text-caption text-[var(--color-ink-muted)]">
          <span>Paso {step} de 3</span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--color-border-default)]">
          <div
            className="h-1.5 rounded-full bg-[var(--accent)] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {step === 1 && (
        <Card padding="lg" className="space-y-4">
          <div>
            <p className="text-overline text-[var(--color-ink-subtle)]">Paso 1 de 3</p>
            <h1 className="mt-1 text-h1 [font-family:var(--font-display)]">¡Bienvenido/a!</h1>
            <p className="mt-2 text-body-sm text-[var(--color-ink-muted)]">
              Contanos cómo te vas a llamar en la comunidad. Esto aparece en tus publicaciones y trades.
            </p>
          </div>

          <FormField label="Nombre visible" required hint="Como querés aparecer ante otros usuarios">
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ej: Nico TCG"
              autoFocus
            />
          </FormField>

          <FormField label="Bio (opcional)" hint="Contá qué coleccionás, qué juegos te gustan">
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Fan de Pokémon desde la Base Set. Busco holográficas…"
              rows={2}
            />
          </FormField>

          <FormField label="Ubicación (opcional)" hint="Ciudad o zona — ayuda a coordinar retiros">
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ej: Buenos Aires, CABA"
            />
          </FormField>

          {error && <p role="alert" className="text-body-sm text-[var(--color-danger)]">{error}</p>}

          <Button onClick={handleStep1} disabled={loading} loading={loading} className="w-full">
            Continuar
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>
      )}

      {step === 2 && (
        <Card padding="lg" className="space-y-4">
          <div>
            <p className="text-overline text-[var(--color-ink-subtle)]">Paso 2 de 3</p>
            <h1 className="mt-1 text-h1 [font-family:var(--font-display)]">Método de cobro</h1>
            <p className="mt-2 text-body-sm text-[var(--color-ink-muted)]">
              Necesitás al menos un método para recibir pagos de los compradores. Podés conectar
              Mercado Pago después desde tu cuenta.
            </p>
          </div>

          <FormField
            label="Alias o CBU de respaldo"
            hint="Los compradores te van a transferir acá cuando no usés MP"
          >
            <Input
              value={paymentAlias}
              onChange={(e) => setPaymentAlias(e.target.value)}
              placeholder="Ej: nico.tcg o 0000003100..."
            />
          </FormField>

          {error && <p role="alert" className="text-body-sm text-[var(--color-danger)]">{error}</p>}

          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setStep(3)} disabled={loading} className="flex-1">
              Saltar por ahora
            </Button>
            <Button onClick={handleStep2} disabled={loading} loading={loading} className="flex-1">
              Guardar y continuar
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card padding="lg" className="space-y-5 text-center">
          <div>
            <CheckCircle className="mx-auto h-12 w-12 text-[var(--color-success)]" />
            <h1 className="mt-3 text-h1 [font-family:var(--font-display)]">¡Todo listo!</h1>
            <p className="mt-2 text-body-sm text-[var(--color-ink-muted)]">
              Ya podés comprar, vender, tradear y participar en subastas y claims.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <button
              onClick={() => handleFinish("/market")}
              disabled={loading}
              className="flex flex-col items-center gap-2 rounded-[var(--r-md)] border border-[var(--glass-border)] bg-[var(--glass-fill)] p-4 text-center transition-colors hover:border-[var(--accent-hi)] hover:bg-[rgba(var(--accent-glow),0.15)] hover:text-[var(--accent-hi)]"
            >
              <ShoppingBag className="h-6 w-6" />
              <span className="text-body-sm font-semibold">Explorar mercado</span>
            </button>
            <button
              onClick={() => handleFinish("/inventory")}
              disabled={loading}
              className="flex flex-col items-center gap-2 rounded-[var(--r-md)] border border-[var(--glass-border)] bg-[var(--glass-fill)] p-4 text-center transition-colors hover:border-[var(--accent-hi)] hover:bg-[rgba(var(--accent-glow),0.15)] hover:text-[var(--accent-hi)]"
            >
              <Tag className="h-6 w-6" />
              <span className="text-body-sm font-semibold">Cargar cartas</span>
            </button>
            <button
              onClick={() => handleFinish("/dashboard")}
              disabled={loading}
              className="flex flex-col items-center gap-2 rounded-[var(--r-md)] border border-[var(--glass-border)] bg-[var(--glass-fill)] p-4 text-center transition-colors hover:border-[var(--accent-hi)] hover:bg-[rgba(var(--accent-glow),0.15)] hover:text-[var(--accent-hi)]"
            >
              <Layers className="h-6 w-6" />
              <span className="text-body-sm font-semibold">Ver dashboard</span>
            </button>
          </div>
        </Card>
      )}
    </section>
  );
}
