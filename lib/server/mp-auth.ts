/**
 * Mercado Pago OAuth credential helpers — server-side only.
 *
 * All operations use the Supabase service-role client so they bypass RLS
 * and can be called from API routes (which don't have a user JWT).
 */

import { getSupabaseAdminClient } from "@/lib/server/supabase";
import { refreshMpToken } from "@/lib/server/mp-client";

const TABLE = "seller_mp_credentials";

export type SellerMpCredential = {
  id: string;
  sellerId: string;
  mpUserId: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;   // ISO timestamp
  scope: string | null;
  liveMode: boolean;
  updatedAt: string;
};

type CredentialRow = {
  id: string;
  seller_id: string;
  mp_user_id: string;
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  scope: string | null;
  live_mode: boolean;
  updated_at: string;
};

function rowToCredential(row: CredentialRow): SellerMpCredential {
  return {
    id: row.id,
    sellerId: row.seller_id,
    mpUserId: row.mp_user_id,
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    expiresAt: row.expires_at,
    scope: row.scope,
    liveMode: row.live_mode,
    updatedAt: row.updated_at,
  };
}

/**
 * Upsert seller MP credentials after OAuth exchange.
 */
export async function saveMpCredentials(input: {
  sellerId: string;
  mpUserId: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;    // seconds from now
  scope: string;
  liveMode: boolean;
}): Promise<SellerMpCredential> {
  const supabase = getSupabaseAdminClient();

  const expiresAt = new Date(Date.now() + input.expiresIn * 1000).toISOString();

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(
      {
        seller_id: input.sellerId,
        mp_user_id: input.mpUserId,
        access_token: input.accessToken,
        refresh_token: input.refreshToken,
        expires_at: expiresAt,
        scope: input.scope,
        live_mode: input.liveMode,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "seller_id" },
    )
    .select()
    .single<CredentialRow>();

  if (error || !data) throw new Error(error?.message ?? "Failed to save MP credentials");
  return rowToCredential(data);
}

/**
 * Get credentials for a seller. Returns null if not connected.
 */
export async function getMpCredentials(sellerId: string): Promise<SellerMpCredential | null> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("seller_id", sellerId)
    .single<CredentialRow>();

  if (error) {
    if (error.code === "PGRST116") return null; // not found
    throw new Error(error.message);
  }
  if (!data) return null;
  return rowToCredential(data);
}

/**
 * Get a valid (non-expired) access_token for the seller,
 * automatically refreshing if it expires within 5 minutes.
 *
 * Throws if the seller hasn't connected MP or refresh fails.
 */
export async function getValidAccessToken(sellerId: string): Promise<string> {
  const cred = await getMpCredentials(sellerId);
  if (!cred) throw new Error("Seller has not connected Mercado Pago.");

  // Refresh if expires within 5 minutes (or unknown expiry)
  const fiveMin = 5 * 60 * 1000;
  const needsRefresh =
    !cred.expiresAt ||
    new Date(cred.expiresAt).getTime() - Date.now() < fiveMin;

  if (!needsRefresh) return cred.accessToken;
  if (!cred.refreshToken) throw new Error("No refresh token available for seller.");

  const refreshed = await refreshMpToken(cred.refreshToken);
  await saveMpCredentials({
    sellerId,
    mpUserId: refreshed.mpUserId,
    accessToken: refreshed.accessToken,
    refreshToken: refreshed.refreshToken,
    expiresIn: refreshed.expiresIn,
    scope: refreshed.scope,
    liveMode: refreshed.liveMode,
  });

  return refreshed.accessToken;
}

/**
 * Delete seller MP credentials (disconnect flow).
 */
export async function deleteMpCredentials(sellerId: string): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("seller_id", sellerId);
  if (error) throw new Error(error.message);
}

/**
 * List all credentials that expire within `withinSeconds`.
 * Used by the token-refresh cron job.
 */
export async function getSoonExpiringCredentials(
  withinSeconds: number,
): Promise<SellerMpCredential[]> {
  const supabase = getSupabaseAdminClient();
  const threshold = new Date(Date.now() + withinSeconds * 1000).toISOString();

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .not("refresh_token", "is", null)
    .or(`expires_at.is.null,expires_at.lt.${threshold}`);

  if (error) throw new Error(error.message);
  return (data as CredentialRow[]).map(rowToCredential);
}
