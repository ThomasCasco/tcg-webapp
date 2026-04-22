import { checkBackendHealth } from "@/lib/server/repository";
import { isSupabaseAnonConfigured } from "@/lib/server/supabase";

export async function GET() {
  const backend = await checkBackendHealth();

  return Response.json({
    service: "tcg-webapp",
    status: backend.connected ? "ok" : "degraded",
    backend,
    authConfigured: isSupabaseAnonConfigured(),
    timestamp: new Date().toISOString(),
  });
}