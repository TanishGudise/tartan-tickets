"use client";

import { useState } from "react";

type Held = { id: string; seats: number; totalCents: number; holdExpiresAt: number };
type Receipt = { name: string; seats: number; totalCents: number; ticketCodes: string[] };

const money = (c: number) => `$${(c / 100).toFixed(2)}`;

export default function Checkout({ eventId }: { eventId: string }) {
  const [name, setName] = useState("");
  const [seats, setSeats] = useState("1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [waitlist, setWaitlist] = useState(false);
  const [held, setHeld] = useState<Held | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  async function start() {
    setBusy(true);
    setError("");
    setWaitlist(false);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, name, seats: Number(seats) }),
    });
    const body = await res.json();
    if (res.ok) setHeld(body.order);
    else {
      setError(body.error ?? "Something went wrong.");
      setWaitlist(body.offer === "waitlist");
    }
    setBusy(false);
  }

  async function pay(outcome: "success" | "decline") {
    if (!held) return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/orders/${held.id}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome }),
    });
    const body = await res.json();
    if (res.ok) setReceipt(body.receipt);
    else setError(body.error ?? "Something went wrong.");
    setHeld(null);
    setBusy(false);
  }

  if (receipt) {
    return (
      <div className="panel">
        <p className="ok">Payment simulated. You have {receipt.seats} ticket{receipt.seats > 1 ? "s" : ""}, {receipt.name}.</p>
        <p>Total: {money(receipt.totalCents)} (no card was charged)</p>
        <p>Ticket codes (one per seat):</p>
        <ul>{receipt.ticketCodes.map((c) => <li key={c}><code>{c}</code></li>)}</ul>
        <p><a href="/">Back to events</a></p>
      </div>
    );
  }

  if (held) {
    return (
      <div className="panel">
        <p>{held.seats} seat{held.seats > 1 ? "s" : ""} held for you until {new Date(held.holdExpiresAt).toLocaleTimeString()} (10 minutes).</p>
        <p>Total: <strong>{money(held.totalCents)}</strong></p>
        <div className="row">
          <button className="btn" disabled={busy} onClick={() => pay("success")}>Simulated payment</button>
          <button className="btn secondary" disabled={busy} onClick={() => pay("decline")}>Simulate declined card</button>
        </div>
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="panel">
      <label htmlFor="name">Your name</label>
      <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alex Doe" />
      <label htmlFor="seats">Seats (1 to 4)</label>
      <input id="seats" type="number" value={seats} onChange={(e) => setSeats(e.target.value)} />
      <div className="row">
        <button className="btn" disabled={busy} onClick={start}>Buy</button>
      </div>
      {error && <p className="error">{error}</p>}
      {waitlist && <p><button className="btn secondary" type="button">Join waitlist</button></p>}
    </div>
  );
}
