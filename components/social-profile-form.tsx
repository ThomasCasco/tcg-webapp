"use client";

import { FormEvent, useState } from "react";
import type { SocialProfile } from "@/lib/domain/types";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  initialProfile: SocialProfile;
};

export function SocialProfileForm({ initialProfile }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatarUrl ?? "");
  const [score, setScore] = useState(initialProfile.completionScore);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      displayName: String(form.get("displayName") ?? "").trim(),
      bio: String(form.get("bio") ?? "").trim(),
      location: String(form.get("location") ?? "").trim(),
      avatarUrl: String(form.get("avatarUrl") ?? "").trim(),
      favoriteGame: String(form.get("favoriteGame") ?? "").trim(),
      favoriteCard: String(form.get("favoriteCard") ?? "").trim(),
      instagram: String(form.get("instagram") ?? "").trim(),
      discord: String(form.get("discord") ?? "").trim(),
    };

    try {
      const response = await fetch("/api/profile/social", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { profile?: SocialProfile; error?: string };
      if (!response.ok) throw new Error(data.error ?? "No se pudo guardar el perfil.");
      setScore(data.profile?.completionScore ?? score);
      setSuccess("Perfil social guardado.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Error desconocido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card padding="lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={initialProfile.username} src={avatarUrl || null} size="lg" />
          <div>
            <p className="text-overline text-[var(--color-ink-subtle)]">Perfil publico</p>
            <h2 className="text-h2">@{initialProfile.username}</h2>
          </div>
        </div>
        <div className="min-w-32 rounded-lg bg-[var(--color-accent-soft)] px-3 py-2 text-center">
          <p className="text-overline text-[var(--color-accent-strong)]">Completitud</p>
          <p className="text-2xl font-semibold text-[var(--color-accent-strong)]">{score}%</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <FormField label="Nombre visible" htmlFor="displayName">
            <Input
              id="displayName"
              name="displayName"
              defaultValue={initialProfile.displayName ?? ""}
              maxLength={60}
              placeholder="Tomi Cards"
            />
          </FormField>

          <FormField label="Ubicacion" htmlFor="location">
            <Input
              id="location"
              name="location"
              defaultValue={initialProfile.location ?? ""}
              maxLength={80}
              placeholder="CABA, Argentina"
            />
          </FormField>

          <div className="md:col-span-2">
            <FormField label="Avatar URL" htmlFor="avatarUrl">
              <Input
                id="avatarUrl"
                name="avatarUrl"
                type="url"
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
                placeholder="https://..."
              />
            </FormField>
          </div>

          <div className="md:col-span-2">
            <FormField label="Bio" htmlFor="bio" hint="Contale a la comunidad que coleccionas y como tradeas.">
              <Textarea
                id="bio"
                name="bio"
                defaultValue={initialProfile.bio ?? ""}
                maxLength={360}
                rows={4}
                placeholder="Colecciono Pokemon vintage, hago trades en persona y busco completar sets de Scarlet & Violet."
              />
            </FormField>
          </div>

          <FormField label="TCG favorito" htmlFor="favoriteGame">
            <Input
              id="favoriteGame"
              name="favoriteGame"
              defaultValue={initialProfile.favoriteGame ?? ""}
              maxLength={60}
              placeholder="Pokemon"
            />
          </FormField>

          <FormField label="Carta favorita" htmlFor="favoriteCard">
            <Input
              id="favoriteCard"
              name="favoriteCard"
              defaultValue={initialProfile.favoriteCard ?? ""}
              maxLength={120}
              placeholder="Gengar VMAX"
            />
          </FormField>

          <FormField label="Instagram" htmlFor="instagram">
            <Input
              id="instagram"
              name="instagram"
              defaultValue={initialProfile.instagram ?? ""}
              maxLength={80}
              placeholder="@usuario"
            />
          </FormField>

          <FormField label="Discord" htmlFor="discord">
            <Input
              id="discord"
              name="discord"
              defaultValue={initialProfile.discord ?? ""}
              maxLength={80}
              placeholder="usuario#1234"
            />
          </FormField>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" loading={loading}>
            Guardar perfil social
          </Button>
          {error && <p role="alert" className="text-body-sm text-[var(--color-danger)]">{error}</p>}
          {success && <p role="status" className="text-body-sm text-[var(--color-success)]">{success}</p>}
        </div>
      </form>
    </Card>
  );
}
