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

## Non-goals for this build

- No real payments. Real Stripe payments are a non-goal; checkout uses a "Simulated payment" button.
- No real authentication. CMU SSO is a non-goal; the buyer types a name into a text box.
- No database. Data lives in memory on the server and resets on every deploy and every server restart.
