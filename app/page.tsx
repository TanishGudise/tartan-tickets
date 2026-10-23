import { listUpcomingEvents } from "../lib/store";

export const dynamic = "force-dynamic";

function money(cents: number) {
  return cents === 0 ? "Free" : `$${(cents / 100).toFixed(2)}`;
}

function when(iso: string) {
  return new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });
}

export default function Home() {
  const events = listUpcomingEvents();
  return (
    <>
      <h1>Upcoming events</h1>
      {events.length === 0 && <p>No upcoming events yet.</p>}
      {events.map((e) => (
        <div className="card" key={e.id}>
          <div>
            <h2>{e.title}</h2>
            <p className="meta">{when(e.startsAt)} · {e.location}</p>
            <p className="meta">{money(e.priceCents)} · {e.seatsRemaining} seats remaining</p>
          </div>
          {e.action === "buy" ? (
            <a className="btn" href={`/events/${e.id}`}>Buy</a>
          ) : (
            <button className="btn secondary" type="button">Join waitlist</button>
          )}
        </div>
      ))}
    </>
  );
}
