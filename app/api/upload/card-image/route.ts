import { requireAuthenticatedUser } from "@/lib/server/auth";
import { getRequestIp, rateLimit } from "@/lib/server/rate-limit";
import { getSupabaseAdminClient, isSupabaseConfigured } from "@/lib/server/supabase";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return Response.json({ error: "Supabase no configurado." }, { status: 503 });
  }

  const user = await requireAuthenticatedUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getRequestIp(request);
  const limit = rateLimit(`upload-card:${user.id}:${ip}`, 20, 60_000);
  if (!limit.allowed) {
    return Response.json(
      { error: `Demasiadas subidas. Reintentá en ${limit.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Body inválido (multipart)." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: 'Falta el archivo en el campo "file".' }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return Response.json({ error: "El archivo supera 5 MB." }, { status: 400 });
  }

  const mime = file.type || "application/octet-stream";
  if (!ALLOWED.has(mime)) {
    return Response.json(
      { error: "Solo se permiten JPEG, PNG, WebP o GIF." },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext =
    mime === "image/jpeg" ? "jpg" : mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "gif";
  const objectPath = `${user.id}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  try {
    const supabase = getSupabaseAdminClient();
    const { error: uploadError } = await supabase.storage
      .from("card-images")
      .upload(objectPath, buffer, {
        contentType: mime,
        upsert: false,
      });

    if (uploadError) {
      return Response.json(
        { error: uploadError.message || "Error al subir a Storage." },
        { status: 502 },
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("card-images").getPublicUrl(objectPath);

    return Response.json({ url: publicUrl });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Error de subida." },
      { status: 500 },
    );
  }
}
