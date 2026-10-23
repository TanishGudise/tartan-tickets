# Tartan Tickets

Club event ticketing for CMU students, built from the Starter Spec A files in [docs/](docs/) for 70-445 HW3.

## Run it

```
npm install
npm run dev    # http://localhost:3000
npm test
npm run build
```

## Built so far

- Story 1: Browse events. The home page lists upcoming events with date, location, price, and seats remaining; a sold-out event shows "Join waitlist" instead of "Buy".
- Story 3: Buy tickets. Up to 4 seats per order, seats held for 10 minutes at checkout, a "Simulated payment" button that shows a receipt with one ticket code per seat, a "Simulate declined card" button that releases the seats, and a waitlist offer when the event sells out during checkout.

## Non-goals for this build

- No real payments. Real Stripe payments are a non-goal; checkout uses a "Simulated payment" button.
- No real authentication. CMU SSO is a non-goal; the buyer types a name into a text box.
- No database. Data lives in memory on the server and resets on every deploy and every server restart. On Vercel each server function keeps its own memory, so counts can differ between pages.
- No email. The receipt and ticket codes are shown on screen instead of emailed.

## Security spec audit

Status of each requirement in [docs/SECURITY_SPEC.md](docs/SECURITY_SPEC.md) against today's build (story 1 and story 3).

| Req | Status | Why |
|---|---|---|
| SEC-1 | Not at all | No sign-in; the buyer types a name (real authentication is a non-goal for HW3). |
| SEC-2 | Not at all | There are no sessions to expire. |
| SEC-3 | Partly | Vercel serves HTTPS, redirects HTTP with a 308, and sends an HSTS header; the app itself does not enforce it. |
| SEC-4 | Not at all | There are no roles yet, so nothing is checked per request. |
| SEC-5 | Not at all | No clubs or officer resources exist yet; nothing is denied or logged. |
| SEC-6 | Not at all | No ticket lookup by owner; order IDs are random but not tied to a user. |
| SEC-7 | Partly | No card data is ever collected (simulated payment), but Stripe Checkout is not integrated. |
| SEC-8 | Fully | The server computes the total from the stored price times seats; the browser sends no amount and any extra field is ignored. |
| SEC-9 | Not at all | No Stripe webhooks exist. |
| SEC-10 | Not at all | No webhooks; paying the same order twice is refused with a 409, so no duplicate tickets from the UI. |
| SEC-11 | Fully | No Stripe keys are used; `.env*` files are gitignored and the repo was scanned for keys before the first commit. |
| SEC-12 | Not at all | No connected Stripe accounts. |
| SEC-13 | Partly | Ticket codes are 128-bit random tokens with no personal data, but there is no QR image and no server-side scan lookup. |
| SEC-14 | Not at all | No check-in yet. |
| SEC-15 | Not at all | No scanning yet. |
| SEC-16 | Partly | Satisfied: the server refuses a 6th checkout for the same event from the same name within 10 minutes and blocks that name for 30 minutes (429), tested in `tests/sec16-checkout-hoarding.test.ts`. Still missing: the "account" is a typed name, so typing a new name gets around it (needs real sign-in), and the counts live in one server's memory, so they reset on deploy and are not shared across Vercel's server copies (needs a shared store). Officers are not notified. |
| SEC-17 | Partly | Orders store name, seats, total, and status only; there is no email or Stripe payment ID yet. |
| SEC-18 | Not at all | No retention job (memory resets on deploy, which is not a policy). |
| SEC-19 | Not at all | No attendee export. |
| SEC-20 | Fully | React escapes all text and the app never uses `dangerouslySetInnerHTML`; there is no officer-entered text yet. |
| SEC-21 | Not at all | No audit log. |
| SEC-22 | Not at all | No audit log. |
