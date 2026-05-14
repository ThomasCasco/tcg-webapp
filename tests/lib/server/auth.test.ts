import { describe, expect, it } from "vitest";
import { decodeAccessToken } from "@/lib/server/auth";

function makeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.fake-signature`;
}

describe("decodeAccessToken", () => {
  it("extracts sub, email and exp from a valid JWT body", () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const token = makeJwt({ sub: "user-123", email: "u@x.com", exp });
    const claims = decodeAccessToken(token);
    expect(claims).toEqual({ sub: "user-123", email: "u@x.com", exp });
  });

  it("falls back to empty email when missing", () => {
    const token = makeJwt({ sub: "user-1", exp: 9999999999 });
    expect(decodeAccessToken(token)?.email).toBe("");
  });

  it("returns null when sub is missing", () => {
    const token = makeJwt({ email: "u@x.com", exp: 9999999999 });
    expect(decodeAccessToken(token)).toBeNull();
  });

  it("returns null when exp is missing", () => {
    const token = makeJwt({ sub: "user-1", email: "u@x.com" });
    expect(decodeAccessToken(token)).toBeNull();
  });

  it("returns null on a malformed token", () => {
    expect(decodeAccessToken("not-a-jwt")).toBeNull();
    expect(decodeAccessToken("")).toBeNull();
    expect(decodeAccessToken("a.b")).toBeNull();
  });
});
