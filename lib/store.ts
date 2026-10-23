// In-memory data store. There is no database: everything here resets on
// every deploy and every server restart (see README, "Scope for HW3").
import { randomBytes } from "node:crypto";

export const MAX_SEATS_PER_ORDER = 4;
export const HOLD_MINUTES = 10;

export type TicketEvent = {
  id: string;
  title: string;
  startsAt: string;
  location: string;
  priceCents: number;
  capacity: number;
  sold: number;
};

export type Order = {
  id: string;
  eventId: string;
  name: string;
  seats: number;
  totalCents: number;
  status: "held" | "paid" | "declined" | "expired";
  createdAt: number;
  holdExpiresAt: number;
  ticketCodes: string[];
};

function seedEvents(): TicketEvent[] {
  return [
    { id: "carnival-concert", title: "Spring Carnival Concert", startsAt: "2027-04-16T19:00:00-04:00", location: "The Cut", priceCents: 1500, capacity: 200, sold: 37 },
    { id: "scotch-n-soda", title: "Scotch'n'Soda Fall Show", startsAt: "2026-11-13T20:00:00-05:00", location: "Rangos Ballroom", priceCents: 1000, capacity: 120, sold: 120 },
    { id: "hackathon-kickoff", title: "Hackathon Kickoff Dinner", startsAt: "2026-12-04T18:00:00-05:00", location: "Gates Hillman 6115", priceCents: 500, capacity: 60, sold: 12 },
    { id: "welcome-mixer", title: "Welcome Back Mixer", startsAt: "2026-08-28T18:00:00-04:00", location: "Cohon Center", priceCents: 0, capacity: 300, sold: 280 },
  ];
}

let events = seedEvents();
let orders = new Map<string, Order>();

export function resetStore() {
  events = seedEvents();
  orders = new Map();
}

function expireHolds(now: number) {
  for (const o of orders.values()) {
    if (o.status === "held" && now >= o.holdExpiresAt) o.status = "expired";
  }
}

function heldSeats(eventId: string) {
  let n = 0;
  for (const o of orders.values()) if (o.eventId === eventId && o.status === "held") n += o.seats;
  return n;
}

export function seatsRemaining(e: TicketEvent, now: number = Date.now()) {
  expireHolds(now);
  return Math.max(0, e.capacity - e.sold - heldSeats(e.id));
}

export function getEvent(id: string) {
  return events.find((e) => e.id === id);
}

export function listUpcomingEvents(now: Date = new Date()) {
  return events
    .filter((e) => Date.parse(e.startsAt) > now.getTime())
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
    .map((e) => {
      const remaining = seatsRemaining(e, now.getTime());
      return {
        id: e.id,
        title: e.title,
        startsAt: e.startsAt,
        location: e.location,
        priceCents: e.priceCents,
        seatsRemaining: remaining,
        action: remaining === 0 ? ("waitlist" as const) : ("buy" as const),
      };
    });
}

export type CheckoutResult =
  | { ok: true; order: Order }
  | { ok: false; status: 400 | 404 | 409; error: string; offer?: "waitlist" };

// Starts checkout and holds the seats. The total is computed here from the
// stored price; nothing the browser sends about money is used (SEC-8).
export function startCheckout(input: { eventId: unknown; name: unknown; seats: unknown }, now: number = Date.now()): CheckoutResult {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name) return { ok: false, status: 400, error: "Type your name to buy tickets." };
  if (name.length > 80) return { ok: false, status: 400, error: "Name must be 80 characters or fewer." };
  const seats = input.seats;
  if (typeof seats !== "number" || !Number.isInteger(seats) || seats < 1 || seats > MAX_SEATS_PER_ORDER) {
    return { ok: false, status: 400, error: `You can buy 1 to ${MAX_SEATS_PER_ORDER} seats per order.` };
  }
  const event = typeof input.eventId === "string" ? getEvent(input.eventId) : undefined;
  if (!event || Date.parse(event.startsAt) <= now) return { ok: false, status: 404, error: "Event not found." };
  if (seatsRemaining(event, now) < seats) {
    return { ok: false, status: 409, error: "Not enough seats left. Join the waitlist instead.", offer: "waitlist" };
  }
  const order: Order = {
    id: randomBytes(8).toString("hex"),
    eventId: event.id,
    name,
    seats,
    totalCents: event.priceCents * seats,
    status: "held",
    createdAt: now,
    holdExpiresAt: now + HOLD_MINUTES * 60 * 1000,
    ticketCodes: [],
  };
  orders.set(order.id, order);
  return { ok: true, order };
}

export type PaymentResult =
  | { ok: true; order: Order }
  | { ok: false; status: 402 | 404 | 409 | 410; error: string; order?: Order };

// Simulated payment: no card is charged. "decline" releases the held seats.
export function simulatePayment(orderId: string, outcome: unknown, now: number = Date.now()): PaymentResult {
  expireHolds(now);
  const order = orders.get(orderId);
  if (!order) return { ok: false, status: 404, error: "Order not found." };
  if (order.status === "expired") return { ok: false, status: 410, error: "Your 10-minute hold expired. Start checkout again.", order };
  if (order.status !== "held") return { ok: false, status: 409, error: `This order is already ${order.status}.`, order };
  if (outcome === "decline") {
    order.status = "declined";
    return { ok: false, status: 402, error: "Card declined. Your seats were released.", order };
  }
  const event = getEvent(order.eventId)!;
  event.sold += order.seats;
  order.status = "paid";
  order.ticketCodes = Array.from({ length: order.seats }, () => randomBytes(16).toString("hex"));
  return { ok: true, order };
}
