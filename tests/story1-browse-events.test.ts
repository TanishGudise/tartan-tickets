import { beforeEach, describe, expect, it } from "vitest";
import { GET } from "../app/api/events/route";
import { resetStore } from "../lib/store";

type EventRow = {
  id: string;
  title: string;
  startsAt: string;
  location: string;
  priceCents: number;
  seatsRemaining: number;
  action: "buy" | "waitlist";
};

async function listEvents(): Promise<EventRow[]> {
  const res = await GET();
  expect(res.status).toBe(200);
  return (await res.json()).events;
}

describe("Story 1: Browse events", () => {
  beforeEach(() => resetStore());

  it("lists upcoming events with the date, location, price, and seats remaining", async () => {
    const events = await listEvents();
    expect(events.length).toBeGreaterThan(0);
    for (const e of events) {
      expect(typeof e.title).toBe("string");
      expect(Number.isNaN(Date.parse(e.startsAt))).toBe(false);
      expect(e.location.length).toBeGreaterThan(0);
      expect(Number.isInteger(e.priceCents)).toBe(true);
      expect(e.seatsRemaining).toBeGreaterThanOrEqual(0);
    }
  });

  it("does not list events that have already happened", async () => {
    const events = await listEvents();
    for (const e of events) {
      expect(Date.parse(e.startsAt)).toBeGreaterThan(Date.now());
    }
  });

  it("shows Join waitlist instead of Buy while an event is sold out", async () => {
    const events = await listEvents();
    const soldOut = events.filter((e) => e.seatsRemaining === 0);
    const open = events.filter((e) => e.seatsRemaining > 0);
    expect(soldOut.length).toBeGreaterThan(0);
    expect(open.length).toBeGreaterThan(0);
    for (const e of soldOut) expect(e.action).toBe("waitlist");
    for (const e of open) expect(e.action).toBe("buy");
  });
});
