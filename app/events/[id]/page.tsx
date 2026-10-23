import { notFound } from "next/navigation";
import { getEvent, seatsRemaining } from "../../../lib/store";
import Checkout from "./Checkout";

export const dynamic = "force-dynamic";

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = getEvent(id);
  if (!event || Date.parse(event.startsAt) <= Date.now()) notFound();
  return (
    <>
      <p><a href="/">← All events</a></p>
      <h1>{event.title}</h1>
      <p className="meta">{event.location} · {event.priceCents === 0 ? "Free" : `$${(event.priceCents / 100).toFixed(2)} per seat`} · {seatsRemaining(event)} seats remaining</p>
      <Checkout eventId={event.id} />
    </>
  );
}
