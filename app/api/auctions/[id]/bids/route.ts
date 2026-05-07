export async function GET() {
  return Response.json(
    { error: "Las subastas estan pausadas por ahora." },
    { status: 410 },
  );
}

export async function POST() {
  return Response.json(
    { error: "Las subastas estan pausadas por ahora." },
    { status: 410 },
  );
}
