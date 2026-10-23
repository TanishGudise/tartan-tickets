export async function POST(_req: Request, _ctx: { params: Promise<{ id: string }> }) {
  return Response.json({ error: "Not built yet" }, { status: 501 });
}
