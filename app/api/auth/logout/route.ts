import { NextResponse } from "next/server";
import { clearSessionCookies } from "@/lib/server/auth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  await clearSessionCookies(response);
  return response;
}
