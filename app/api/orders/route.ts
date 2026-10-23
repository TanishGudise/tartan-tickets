import { startCheckout } from "../../../lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Send JSON." }, { status: 400 });
  }
  const result = startCheckout({ eventId: body?.eventId, name: body?.name, seats: body?.seats });
  if (!result.ok) return Response.json({ error: result.error, offer: result.offer }, { status: result.status });
  const { id, eventId, seats, totalCents, status, holdExpiresAt } = result.order;
  return Response.json({ order: { id, eventId, seats, totalCents, status, holdExpiresAt } }, { status: 201 });
}
