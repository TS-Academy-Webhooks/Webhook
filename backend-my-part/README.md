# Logistics Webhook Management Platform — Backend

Matches the folder structure your teammate set up on GitHub (`src/controllers`, `src/routes`, `src/services`, dot-case filenames like `auth.controller.js`).

## What changed from the earlier drop

1. **Renamed everything to dot-case** to match the repo (`authController.js` → `auth.controller.js`, etc.)
2. **Split the delivery logic into 4 service files**, matching what was already in the `services/` folder:
   - `delivery.service.js` — signs the request and makes exactly one HTTP attempt
   - `retry.service.js` — runs the retry loop (up to 3 attempts) and handles manual resends
   - `event.service.js` — creates an Event and dispatches it to every matching webhook
   - `webhook.service.js` — finds webhooks matching an event type, generates/masks secrets
3. **Dropped the URL-safety (SSRF) check.** Webhook URLs are now only checked for a valid `https://` format — no more DNS lookups or private-IP blocking. This was extra depth beyond what the capstone brief requires; the webhook controller now does a simple format check instead.
4. **Dropped admin and stats endpoints**, since they weren't in the agreed folder structure. Easy to add back later if a tutor asks for a dashboard or admin view — ask and I'll build them into this structure.
5. Kept the demo-receiver testing endpoints out of this drop since they weren't part of the agreed structure either. If your team wants an easy way to test real webhook deliveries without an external server, let me know and I'll add `demo-receiver.controller.js` / `demo-receiver.routes.js` as clearly-optional extras.

## What's still the same

Everything else — the models, the auth logic, the shipment status/event/delivery flow, the response format — is functionally identical to before. I re-ran the same tests after the restructure to make sure nothing broke:

- Every file passes a syntax check, and the full app boots with all routes mounted
- Health check, protected-route rejection, and validation errors all confirmed still working
- The delivery engine was re-tested end-to-end against a real local server after the service split: successful delivery, independently-verified HMAC signature, and the full 3-attempt retry-then-fail sequence all still work correctly

**Still not testable from my side:** actual MongoDB reads/writes, since this environment can't run a real database. Once you have your Atlas connection string in `.env`, test register → login → create webhook → create shipment → update status → check the delivery got recorded.

## Setup

```bash
npm install
cp .env.example .env
```

Fill in `.env`:
- `MONGO_URI` — your MongoDB Atlas connection string
- `JWT_SECRET` — any long random string

```bash
npm run dev
```

## Folder structure

```
backend/
├── src/
│   ├── app.js
│   ├── config/
│   │   └── db.config.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── delivery.controller.js
│   │   ├── event.controller.js
│   │   ├── shipment.controller.js
│   │   ├── tracking.controller.js
│   │   └── webhook.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── error.middleware.js
│   ├── models/
│   │   ├── Delivery.js
│   │   ├── Event.js
│   │   ├── Shipment.js
│   │   ├── User.js
│   │   └── Webhook.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── delivery.routes.js
│   │   ├── event.routes.js
│   │   ├── shipment.routes.js
│   │   ├── tracking.routes.js
│   │   └── webhook.routes.js
│   ├── services/
│   │   ├── delivery.service.js
│   │   ├── event.service.js
│   │   ├── retry.service.js
│   │   └── webhook.service.js
│   └── utils/
│       ├── app-error.js
│       ├── catch-async.js
│       ├── constants.js
│       └── jwt.js
├── .env.example
├── .gitignore
└── package.json
```
