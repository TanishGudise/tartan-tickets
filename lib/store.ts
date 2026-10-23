// In-memory data store. There is no database: everything here resets on
// every deploy and every server restart (see README, "Scope for HW3").

export type TicketEvent = {
  id: string;
  title: string;
  startsAt: string;
  location: string;
  priceCents: number;
  capacity: number;
  sold: number;
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

export function resetStore() {
  events = seedEvents();
}

export function seatsRemaining(e: TicketEvent) {
  return Math.max(0, e.capacity - e.sold);
}

export function listUpcomingEvents(now: Date = new Date()) {
  return events
    .filter((e) => Date.parse(e.startsAt) > now.getTime())
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
    .map((e) => {
      const remaining = seatsRemaining(e);
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
