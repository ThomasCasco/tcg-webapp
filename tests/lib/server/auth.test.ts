// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { createClient, type JWK } from "@supabase/supabase-js";
import { verifyAccessToken } from "@/lib/server/auth";

const KID = "test-kid";
// Unreachable on purpose: any fallback to the Auth server must fail closed.
const client = createClient("http://127.0.0.1:9", "test-key", {
  auth: { autoRefreshToken: false, persistSession: false },
});

let privateKey: CryptoKey;
let jwks: { keys: JWK[] };

const b64url = (input: string | Uint8Array) =>
  Buffer.from(input).toString("base64url");

async function signEs256(payload: Record<string, unknown>, key = privateKey): Promise<string> {
  const head = b64url(JSON.stringify({ alg: "ES256", typ: "JWT", kid: KID }));
  const body = b64url(JSON.stringify(payload));
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(`${head}.${body}`),
  );
  return `${head}.${body}.${b64url(new Uint8Array(sig))}`;
}

function claims(overrides: Record<string, unknown> = {}) {
  return {
    sub: "user-123",
    email: "u@x.com",
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...overrides,
  };
}

beforeAll(async () => {
  const pair = (await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  )) as CryptoKeyPair;
  privateKey = pair.privateKey;
  const publicJwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  jwks = {
    keys: [{ ...publicJwk, kid: KID, alg: "ES256", use: "sig", key_ops: ["verify"] } as JWK],
  };
});

describe("verifyAccessToken", () => {
  it("accepts a token signed with the project key", async () => {
    const payload = claims();
    const token = await signEs256(payload);
    await expect(verifyAccessToken(token, { client, jwks })).resolves.toEqual({
      sub: payload.sub,
      email: payload.email,
      exp: payload.exp,
    });
  });

  it("rejects a token whose payload was swapped after signing", async () => {
    const token = await signEs256(claims());
    const [head, , sig] = token.split(".");
    const forgedBody = b64url(JSON.stringify(claims({ sub: "victim-id" })));
    await expect(
      verifyAccessToken(`${head}.${forgedBody}.${sig}`, { client, jwks }),
    ).resolves.toBeNull();
  });

  it("rejects a token signed with a different key", async () => {
    const other = (await crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign", "verify"],
    )) as CryptoKeyPair;
    const token = await signEs256(claims({ sub: "victim-id" }), other.privateKey);
    await expect(verifyAccessToken(token, { client, jwks })).resolves.toBeNull();
  });

  it("rejects an unsigned token (alg none) with a fake signature", async () => {
    const head = b64url(JSON.stringify({ alg: "none", typ: "JWT" }));
    const body = b64url(JSON.stringify(claims({ sub: "victim-id", exp: 4102444800 })));
    await expect(
      verifyAccessToken(`${head}.${body}.fake-signature`, { client, jwks }),
    ).resolves.toBeNull();
  });

  it("rejects an expired token even when correctly signed", async () => {
    const token = await signEs256(claims({ exp: Math.floor(Date.now() / 1000) - 60 }));
    await expect(verifyAccessToken(token, { client, jwks })).resolves.toBeNull();
  });

  it("rejects malformed input", async () => {
    await expect(verifyAccessToken("", { client, jwks })).resolves.toBeNull();
    await expect(verifyAccessToken("a.b", { client, jwks })).resolves.toBeNull();
    await expect(verifyAccessToken("not-a-jwt", { client, jwks })).resolves.toBeNull();
  });
});
