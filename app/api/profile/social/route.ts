import { requireAuthenticatedUser } from "@/lib/server/auth";
import { getSocialProfile, updateSocialProfile } from "@/lib/server/repository";

type SocialProfilePayload = {
  displayName?: string;
  bio?: string;
  location?: string;
  avatarUrl?: string;
  favoriteGame?: string;
  favoriteCard?: string;
  instagram?: string;
  discord?: string;
};

function validateUrl(value?: string): boolean {
  if (!value?.trim()) return true;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export async function GET() {
  const user = await requireAuthenticatedUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const profile = await getSocialProfile(user.id);
    return Response.json({ profile });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to load profile." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const user = await requireAuthenticatedUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: SocialProfilePayload;
  try {
    payload = (await request.json()) as SocialProfilePayload;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!validateUrl(payload.avatarUrl)) {
    return Response.json({ error: "avatarUrl must be a valid URL." }, { status: 400 });
  }

  if (payload.bio && payload.bio.trim().length > 360) {
    return Response.json({ error: "bio must be at most 360 characters." }, { status: 400 });
  }

  try {
    const profile = await updateSocialProfile({
      userId: user.id,
      displayName: payload.displayName,
      bio: payload.bio,
      location: payload.location,
      avatarUrl: payload.avatarUrl,
      favoriteGame: payload.favoriteGame,
      favoriteCard: payload.favoriteCard,
      instagram: payload.instagram,
      discord: payload.discord,
    });

    return Response.json({ profile });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to update profile." },
      { status: 500 },
    );
  }
}
