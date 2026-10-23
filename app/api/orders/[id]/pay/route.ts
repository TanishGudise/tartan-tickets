import { simulatePayment } from "../../../../../lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // no body: treat as a successful simulated payment
  }
  const result = simulatePayment(id, body?.outcome);
  if (!result.ok) return Response.json({ error: result.error, order: result.order && { id: result.order.id, status: result.order.status } }, { status: result.status });
  const { status, seats, totalCents, ticketCodes, name } = result.order;
  return Response.json({ order: { id, status, seats }, receipt: { name, seats, totalCents, ticketCodes } });
}
