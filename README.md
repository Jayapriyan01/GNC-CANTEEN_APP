# Flasho

A canteen pre-ordering app: login → pick a canteen → build a cart →
pay by scanning a UPI QR code → get an order ID to show at the counter.

```
flasho/
├── public/            ← frontend (served as static files)
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── assets/qr-code.jpg   ← your UPI QR
├── server/             ← backend (Node + Express)
│   ├── server.js
│   ├── package.json
│   ├── orders.json     ← order data, stored as JSON on disk
│   └── .env.example
└── README.md
```

## Run it

```bash
cd server
npm install
npm start
```

Then open **http://localhost:4000** — the backend serves the frontend
too, so that's the only URL you need.

## How checkout works right now

1. The customer builds a cart and taps **Checkout**.
2. The frontend calls `POST /api/orders`, which saves the order to
   `server/orders.json` with `status: "awaiting_payment"`.
3. The checkout page shows your QR image (`public/assets/qr-code.jpg`)
   and the amount to pay.
4. The customer scans it in their own UPI app (GPay/PhonePe/Paytm) and
   pays you directly — **that payment happens entirely inside their
   banking app; your server is not involved in it.**
5. When they tap **"I've completed the payment,"** the frontend calls
   `POST /api/orders/:id/confirm`, which just flips the order's status
   to `"paid"` in your JSON file.

## Important: this does not verify payment

Step 5 is a **self-declaration** — the server has no way to check that
money actually moved. Someone could tap that button without paying,
and the order would still show as "paid." That's fine for a low-stakes
class project or a small canteen run on trust, but don't rely on it
for anything where that matters.

To get **real, verified** payments, you'd swap the manual-confirm step
for a UPI/payment gateway that supports server-to-server verification,
for example:

- **Razorpay** (Payment Links or UPI Intent + webhooks) — popular in
  India, has a generous free tier for testing.
- **Cashfree** — similar UPI-first flow.
- **Instamojo** — simpler, good for very small projects.

The pattern is the same for all of them: you create an order through
their API, redirect the customer to their hosted checkout (or generate
a dynamic QR *they* produce, tied to that specific order and amount),
and they call your server's **webhook** endpoint once the bank has
actually confirmed the transfer — only then do you mark the order
paid. That webhook call is the part a static personal QR code and a
manual "I've paid" button can't give you.

## API reference

| Method | Route                     | What it does                                  |
|--------|---------------------------|------------------------------------------------|
| POST   | `/api/orders`              | Create an order: `{ items: [{name, price, qty}], canteen }` |
| GET    | `/api/orders/:id`          | Fetch one order                               |
| POST   | `/api/orders/:id/confirm`  | Mark an order `paid` (manual, see caveat above) |
| GET    | `/api/orders`              | List all orders (optionally `?status=paid`)   |

## Notes

- Orders persist in `server/orders.json`. Good enough for a demo;
  swap in SQLite/Postgres if this needs to survive real concurrent
  traffic.
- There's no real authentication yet — login is a client-side form
  check. Add a users table + sessions/JWT if you need actual accounts.
- Change the port via `server/.env` (copy `.env.example`) if 4000 is
  taken.
