import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as startCheckout } from "../app/api/orders/route";
import { resetStore } from "../lib/store";

const EVENT = "carnival-concert";

function checkout(name: string) {
  return startCheckout(new Request("http://test/api/orders", { method: "POST", body: JSON.stringify({ eventId: EVENT, name, seats: 1 }) }));
}

describe("SEC-16: checkout hoarding", () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-22T12:00:00-04:00"));
  });
  afterEach(() => vi.useRealTimers());

  it("blocks a sixth checkout for the same event from the same person within 10 minutes, for 30 minutes", async () => {
    for (let i = 0; i < 5; i++) {
      expect((await checkout("Hoarder")).status).toBe(201);
      vi.advanceTimersByTime(60 * 1000);
    }
    const sixth = await checkout("Hoarder");
    expect(sixth.status).toBe(429);

    // Someone else can still buy.
    expect((await checkout("Other Student")).status).toBe(201);

    // Still blocked 29 minutes later, allowed again after 30.
    vi.advanceTimersByTime(29 * 60 * 1000);
    expect((await checkout("Hoarder")).status).toBe(429);
    vi.advanceTimersByTime(60 * 1000);
    expect((await checkout("Hoarder")).status).toBe(201);
  });
});
