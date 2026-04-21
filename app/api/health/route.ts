export async function GET() {
  return Response.json({
    service: "tcg-webapp",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}