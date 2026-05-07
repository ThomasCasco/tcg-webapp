const pausedResponse = () =>
  Response.json(
    { error: "Las subastas estan pausadas por ahora." },
    { status: 410 },
  );

export async function GET() {
  return pausedResponse();
}

export async function POST() {
  return pausedResponse();
}

export async function PATCH() {
  return pausedResponse();
}
