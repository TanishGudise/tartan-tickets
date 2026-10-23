import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as listEvents } from "../app/api/events/route";
import { POST as startCheckout } from "../app/api/orders/route";
import { POST as pay } from "../app/api/orders/[id]/pay/route";
import { resetStore } from "../lib/store";

const OPEN_EVENT = "hackathon-kickoff"; // capacity 60, 12 sold, $5.00

function checkout(body: unknown) {
  return startCheckout(new Request("http://test/api/orders", { method: "POST", body: JSON.stringify(body) }));
}

function payOrder(id: string, outcome: "success" | "decline") {
  return pay(new Request(`http://test/api/orders/${id}/pay`, { method: "POST", body: JSON.stringify({ outcome }) }), {
    params: Promise.resolve({ id }),
  });
}

async function seatsLeft(eventId: string): Promise<number> {
  const { events } = await (await listEvents()).json();
  return events.find((e: { id: string }) => e.id === eventId).seatsRemaining;
}

describe("Story 3: Buy tickets", () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-22T12:00:00-04:00"));
  });
  afterEach(() => vi.useRealTimers());

  it("caps an order at 4 seats and rejects 5 with a 400", async () => {
    expect((await checkout({ eventId: OPEN_EVENT, name: "Alex Doe", seats: 5 })).status).toBe(400);
    expect((await checkout({ eventId: OPEN_EVENT, name: "Alex Doe", seats: 0 })).status).toBe(400);
    expect((await checkout({ eventId: OPEN_EVENT, name: "Alex Doe", seats: 4 })).status).toBe(201);
  });

  it("holds the seats for 10 minutes when checkout starts, then gives them back", async () => {
    const before = await seatsLeft(OPEN_EVENT);
    const res = await checkout({ eventId: OPEN_EVENT, name: "Alex Doe", seats: 3 });
    expect(res.status).toBe(201);
    expect(await seatsLeft(OPEN_EVENT)).toBe(before - 3);
    vi.advanceTimersByTime(9 * 60 * 1000 + 59 * 1000);
    expect(await seatsLeft(OPEN_EVENT)).toBe(before - 3);
    vi.advanceTimersByTime(2 * 1000);
    expect(await seatsLeft(OPEN_EVENT)).toBe(before);
  });

  it("shows a receipt with one ticket code per seat when the simulated payment succeeds", async () => {
    const { order } = await (await checkout({ eventId: OPEN_EVENT, name: "Alex Doe", seats: 2 })).json();
    const res = await payOrder(order.id, "success");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.order.status).toBe("paid");
    expect(body.receipt.ticketCodes).toHaveLength(2);
    expect(new Set(body.receipt.ticketCodes).size).toBe(2);
    expect(body.receipt.totalCents).toBe(1000);
  });

  it("releases the held seats when the card is declined", async () => {
    const before = await seatsLeft(OPEN_EVENT);
    const { order } = await (await checkout({ eventId: OPEN_EVENT, name: "Alex Doe", seats: 4 })).json();
    expect(await seatsLeft(OPEN_EVENT)).toBe(before - 4);
    const res = await payOrder(order.id, "decline");
    expect(res.status).toBe(402);
    expect(await seatsLeft(OPEN_EVENT)).toBe(before);
  });

  it("offers the waitlist when the event sells out during checkout", async () => {
    // 48 seats left: twelve buyers hold 4 each, so the event is sold out.
    for (let i = 0; i < 12; i++) {
      expect((await checkout({ eventId: OPEN_EVENT, name: `Buyer ${i}`, seats: 4 })).status).toBe(201);
    }
    const res = await checkout({ eventId: OPEN_EVENT, name: "Late Buyer", seats: 1 });
    expect(res.status).toBe(409);
    expect((await res.json()).offer).toBe("waitlist");
  });
});
