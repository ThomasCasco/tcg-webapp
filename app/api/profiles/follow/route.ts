import { requireAuthenticatedUser } from "@/lib/server/auth";
import { setProfileFollow } from "@/lib/server/repository";

type FollowPayload = {
  followingId?: string;
  follow?: boolean;
};

export async function POST(request: Request) {
  const user = await requireAuthenticatedUser().catch(() => null);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let payload: FollowPayload;
  try {
    payload = (await request.json()) as FollowPayload;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!payload.followingId) {
    return Response.json({ error: "followingId is required." }, { status: 400 });
  }

  try {
    const result = await setProfileFollow({
      followerId: user.id,
      followingId: payload.followingId,
      follow: Boolean(payload.follow),
    });
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to update follow." },
      { status: 500 },
    );
  }
}
