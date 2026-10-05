# Logistics Webhook Backend

Node.js, Express, and MongoDB backend for shipment tracking and webhook delivery. Express remains the canonical server; when `frontend/dist` exists it serves the Vite site and `/api` from the same origin, including prerendered HTML. The API continues to run without a frontend build for local development and tests.

## Setup

Requirements: Node.js 20.19 or later and a reachable MongoDB instance.

1. From `backend`, run `npm ci`.
2. Create `.env` from `.env.example` if you do not already have a local `.env`.
3. Set `MONGO_URI`, a random `JWT_SECRET` of at least 32 characters, and unique `ADMIN_EMAIL` / `ADMIN_PASSWORD` values (at least 12 characters).
4. Back up the MongoDB database before the first run of the merged backend, then run `npm run dev`. Startup applies idempotent legacy-field migrations, assigns the bootstrap admin if it does not exist, and waits for migrations to finish before listening.

The bootstrap admin is created once and is never publicly registerable. Keep its credentials in a secret manager; do not share this account with customers. Set `CORS_ORIGIN` to the exact frontend origin(s), comma-separated. Production also requires HTTPS and non-example JWT/admin secrets. `ALLOW_LOCALHOST_WEBHOOKS=true` permits loopback webhook URLs in development only. The public in-memory demo receiver is disabled in production unless `ENABLE_DEMO_RECEIVER=true`; leave it disabled for deployment. `GET /health` and `GET /api/health` are public and return:

```json
{"success":true,"message":"API is healthy","data":{"status":"ok"}}
```

## Response format

Every response uses the same envelope. Successful requests use the endpoint's listed status code; errors use `data: null` and validation errors also include an `errors` array. Paginated lists expose `items` and resource-named aliases, with `pagination.total` and `pagination.totalItems`. Records retain `_id` and include the legacy `id` alias.

```json
{"success":true,"message":"...","data":{}}
```

```json
{"success":false,"message":"...","data":null}
```

Customer registration creates only customer accounts. Admin accounts are provisioned from environment variables at startup, never through public registration. Customers can create and view only their own shipments and webhooks/deliveries; customer-owned webhooks receive only their assigned shipments' events. Admin-owned hooks can receive platform-wide events. Only admins can change shipment status or inspect event and demo-receiver history.

Login and registration return a 15-minute `accessToken` for `Authorization: Bearer <accessToken>` and set a 30-day refresh token in an HttpOnly, SameSite cookie. Keep the access token in memory in the frontend; do not store it in `localStorage`. Call `POST /api/auth/refresh` with browser credentials to rotate that cookie and get a new access token. Call `POST /api/auth/logout` to revoke the current refresh session; access tokens are tied to that session, so logout invalidates them immediately. Authenticated users can change their password at `POST /api/auth/change-password`; this revokes every active session for that account. Browser requests to auth endpoints that set/send cookies must use `credentials: "include"` (or the equivalent) and the API must allow the frontend origin.

Login, registration, and refresh also return the compatibility alias `token` alongside `accessToken`. `GET /api/auth/me` returns the public user both as flat fields and under `data.user`.

`GET /api-docs` serves Swagger UI and `GET /api-docs/openapi.yaml` serves the OpenAPI contract. `/docs` is the public developer guide in the Vite application. For production, build the Vite app first; Express serves existing files/prerendered pages from `frontend/dist` after API, health, and Swagger routes. Unknown `/api/*` requests always return the API error envelope rather than `index.html`. With no build output, `/` retains the API status envelope.

Review [`API_MIGRATION.md`](API_MIGRATION.md) for the field migrations, backup/rollback steps, and client sign-in impact before deployment.

## API reference

| Method and path | Purpose | Auth | Body or query | Success |
| --- | --- | --- | --- | --- |
| `POST /api/auth/register` | Create a customer account | No | `{ "name", "email", "password" }`; password min 12 chars | `201`, customer and access token; sets refresh cookie |
| `POST /api/auth/login` | Sign in as admin or customer | No | `{ "email", "password" }` | `200`, user and access token; sets refresh cookie |
| `POST /api/auth/refresh` | Rotate refresh session and issue access token | Refresh cookie | None | `200`, user and access token; rotates cookie |
| `POST /api/auth/logout` | Revoke the current refresh session | Refresh cookie | None | `200`, logout confirmation |
| `POST /api/auth/change-password` | Change current user's password and revoke sessions | Yes | `{ "currentPassword", "newPassword" }`; new password min 12 chars | `200`, sign in again |
| `GET /api/auth/me` | Read current user and role | Access token | None | `200`, user |
| `GET /api/shipments` | List shipments; customers see only their own | Yes | `search`, `status`, `page`, `limit` (max 100) | `200`, shipments and pagination |
| `POST /api/shipments` | Create shipment and `shipment.created` event | Yes | Customer: `{ "origin", "destination", "amount" }`; admin also supplies `customer` and may supply `customerId` | `201`, shipment |
| `GET /api/shipments/:id` | Read one shipment; customer ownership enforced | Yes | MongoDB shipment ID | `200`, shipment |
| `PATCH /api/shipments/:id/customer` | Assign or migrate a shipment to a customer | Admin | `{ "customerId": "<customer MongoDB ID>" }` | `200`, updated shipment |
| `PATCH /api/shipments/:id/status` | Admin applies a legal transition and emits an event | Admin | `{ "status": "picked_up", "note": "optional" }` | `200`, updated shipment |
| `GET /api/tracking/:trackingNumber` | Public shipment tracking | No | `TRK-` plus five digits | `200`, tracking number, status, origin/destination, timeline, lastUpdated |
| `GET /api/webhooks` | List owned webhooks; admins see all | Yes | `search`, `event`, `active`/`isActive`, `page`, `limit` | `200`, webhooks and pagination |
| `POST /api/webhooks` | Create an owned webhook | Yes | `{ "name", "url", "events": ["shipment.created"] }`; `"*"` subscribes to all events | `201`, webhook and one-time secret |
| `GET /api/webhooks/:id` | Read an owned webhook; secret masked | Yes | MongoDB webhook ID | `200`, webhook |
| `PATCH` or `PUT /api/webhooks/:id` | Update name, URL, subscriptions, active state, or regenerate secret | Yes | Supported fields include legacy `active` and canonical `isActive` | `200`, updated webhook |
| `DELETE /api/webhooks/:id` | Delete an owned webhook | Yes | MongoDB webhook ID | `200`, deleted ID |
| `POST /api/webhooks/:id/test` | Queue a `webhook.test` delivery | Yes | MongoDB webhook ID | `202`, pending summary |
| `GET /api/webhooks/:id/deliveries` | List delivery summaries and attempts for one hook | Yes | `page`, `limit`, `status` | `200`, summaries and pagination |
| `GET /api/events` | List events | Admin | `type`, `shipmentId`, `search` (event ID), `page`, `limit` | `200`, events and pagination |
| `GET /api/events/:id` | Read by MongoDB ID or `evt_` ID, with associated deliveries | Admin | Event identifier | `200`, event and deliveries |
| `GET /api/deliveries` | List owned delivery summaries; admins see all | Yes | `page`, `limit`, `status`, `webhookId`, `eventId`, `from`, `to` | `200`, summaries and pagination |
| `GET /api/deliveries/:id` | Read a summary with nested attempts; historical attempt IDs also work | Yes | MongoDB summary or attempt ID | `200`, summary and attempts |
| `POST /api/deliveries/:id/resend` or `/retry` | Queue another attempt; accepts summary or historical attempt ID | Yes | MongoDB summary or attempt ID | `202`, pending summary |
| `POST /api/demo-receiver` | Store received headers/body and check signature when possible; development only by default | No | Any JSON webhook body | `201`, received request |
| `GET /api/demo-receiver` | List filtered requests received by this process; admin only | Admin | `page`, `limit`, `signatureValid`, `event` | `200`, received requests |
| `POST /api/demo-receiver/fail` | Deliberately return a failure to exercise retries; development only by default | No | Any | `500`, error envelope |
| `DELETE /api/demo-receiver` | Clear in-memory receiver history | Admin | None | `200`, cleared count |
| `GET/PATCH/DELETE /api/demo-receiver/config` | Read, update, or reset response profiles | Admin | Success/failure JSON status and body profiles | `200`, configuration |

Common errors: `400` invalid input or illegal transition, `401` missing/invalid access or refresh token, `403` authenticated role lacks permission, `404` missing or non-owned record, `409` duplicate unique value, `429` rate limit, and `500` unexpected server error. Customer tracking intentionally excludes the customer name, amount, MongoDB ID, and internal fields.

Access tokens are bound to a database refresh-session record. Refresh tokens are random, stored only as SHA-256 hashes, rotated atomically on refresh, and revoked at logout. Legacy password hashes and roles are normalized at startup; customer-created legacy shipments are assigned to their creator, while unassigned/admin-created shipments remain admin-visible until assigned through the admin shipment-customer endpoint. Public registration ignores any submitted role and always creates a customer.

Before opening customer registration to production traffic, add provider-backed email verification and password recovery. Those flows are not enabled because no email delivery provider or sender configuration has been selected.

## Shipment statuses

`created -> picked_up -> in_transit -> arrived_at_hub -> out_for_delivery -> delivered`

`arrived_at_hub` can return to `in_transit`; `out_for_delivery` can become `delivery_failed`, which can return to `out_for_delivery` or be cancelled. `created`, `picked_up`, `in_transit`, and `arrived_at_hub` can be cancelled. `delivered` and `cancelled` are final. Invalid transitions return `400`.

## Webhook delivery and security

Each matching active webhook receives a POST with a five-second timeout. The request body remains the exact `JSON.stringify(event.payload)` used by the existing backend; no wrapper or timestamp is added. `X-Webhook-Signature` remains the lowercase hex HMAC-SHA256 of those exact raw JSON bytes, with no `sha256=` prefix. Receivers must verify the raw request body and compare signatures in constant time. The demo receiver additionally accepts the timestamped-envelope signature used by davinci, but this backend does not emit that format. Any 2xx response succeeds; redirects, other statuses, and network errors fail. Failed automatic deliveries are recorded as individual attempts under a delivery summary and retried after 2 and 5 seconds, for at most three total attempts. Responses are truncated to 1000 characters.

The webhook secret is generated with cryptographic randomness, returned only when creating or explicitly regenerating the webhook, and masked on later reads. Store it securely. Webhook URLs can otherwise be abused to make the server contact internal services (SSRF). Production validation resolves hostnames and blocks localhost/private addresses; development localhost access requires `ALLOW_LOCALHOST_WEBHOOKS=true`. Redirects are not followed. DNS can change after validation, so production deployments should also restrict outbound network access.

## End-to-end checklist (PowerShell)

Run with the backend at `http://localhost:3000`, MongoDB available, and development localhost webhooks enabled. Set `$env:ADMIN_EMAIL` and `$env:ADMIN_PASSWORD` in your secure shell/secret manager before running the admin requests. These commands use `Invoke-RestMethod`, which parses the response JSON.

```powershell
$base = "http://localhost:3000"
$webSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$login = Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" -WebSession $webSession -ContentType "application/json" -Body (@{ email = $env:ADMIN_EMAIL; password = $env:ADMIN_PASSWORD } | ConvertTo-Json)
$headers = @{ Authorization = "Bearer $($login.data.accessToken)" }

# Customer registration always creates a customer; the server ignores any submitted role.
$customer = Invoke-RestMethod -Method Post -Uri "$base/api/auth/register" -ContentType "application/json" -Body (@{ name = "Demo Customer"; email = "customer@example.com"; password = "customer-demo-password-123"; role = "admin" } | ConvertTo-Json)
$customerHeaders = @{ Authorization = "Bearer $($customer.data.accessToken)" }
$customerShipment = Invoke-RestMethod -Method Post -Uri "$base/api/shipments" -Headers $customerHeaders -ContentType "application/json" -Body (@{ origin = "Boston"; destination = "Chicago"; amount = 15 } | ConvertTo-Json)
Invoke-RestMethod -Method Get -Uri "$base/api/shipments" -Headers $customerHeaders # Contains only this customer's shipment.

# Refresh rotates the HttpOnly cookie kept in the web session; logout revokes it and the access token.
$refreshed = Invoke-RestMethod -Method Post -Uri "$base/api/auth/refresh" -WebSession $webSession
$headers = @{ Authorization = "Bearer $($refreshed.data.accessToken)" }

# Create a webhook to the public in-process demo receiver; save the secret shown only here.
$webhook = Invoke-RestMethod -Method Post -Uri "$base/api/webhooks" -Headers $headers -ContentType "application/json" -Body (@{ name = "Demo receiver"; url = "$base/api/demo-receiver"; events = @("shipment.created", "shipment.picked_up", "shipment.in_transit", "shipment.arrived_at_hub", "shipment.out_for_delivery", "shipment.delivered") } | ConvertTo-Json)
$webhookId = $webhook.data._id
$webhookSecret = $webhook.data.secret

# Create a shipment, then move it through valid statuses.
$shipment = Invoke-RestMethod -Method Post -Uri "$base/api/shipments" -Headers $headers -ContentType "application/json" -Body (@{ customer = "Sample Customer"; origin = "Boston"; destination = "Chicago"; amount = 42.50 } | ConvertTo-Json)
$shipmentId = $shipment.data._id
foreach ($status in @("picked_up", "in_transit", "arrived_at_hub", "out_for_delivery", "delivered")) {
  Invoke-RestMethod -Method Patch -Uri "$base/api/shipments/$shipmentId/status" -Headers $headers -ContentType "application/json" -Body (@{ status = $status } | ConvertTo-Json)
}
Invoke-RestMethod -Method Get -Uri "$base/api/webhooks/$webhookId/deliveries" -Headers $headers
Invoke-RestMethod -Method Get -Uri "$base/api/demo-receiver" -Headers $headers # Inspect received body and signatureValid (admin only).

# Create a failure destination and subscribe it to a later transition.
$failingHook = Invoke-RestMethod -Method Post -Uri "$base/api/webhooks" -Headers $headers -ContentType "application/json" -Body (@{ name = "Retry demo"; url = "$base/api/demo-receiver/fail"; events = @("shipment.delivery_failed") } | ConvertTo-Json)
$failureShipment = Invoke-RestMethod -Method Post -Uri "$base/api/shipments" -Headers $headers -ContentType "application/json" -Body (@{ customer = "Retry Customer"; origin = "Boston"; destination = "Chicago"; amount = 10 } | ConvertTo-Json)
$failureShipmentId = $failureShipment.data._id
foreach ($status in @("picked_up", "in_transit", "arrived_at_hub", "out_for_delivery", "delivery_failed")) {
  Invoke-RestMethod -Method Patch -Uri "$base/api/shipments/$failureShipmentId/status" -Headers $headers -ContentType "application/json" -Body (@{ status = $status } | ConvertTo-Json)
}
Start-Sleep -Seconds 8 # Allow the initial attempt and both retry delays to finish.
$attempts = Invoke-RestMethod -Method Get -Uri "$base/api/webhooks/$($failingHook.data._id)/deliveries" -Headers $headers
$attempts.data.deliveries

# Use one recorded attempt ID to create a separate manual resend attempt.
$attemptId = $attempts.data.deliveries[0].attempts[0]._id
Invoke-RestMethod -Method Post -Uri "$base/api/deliveries/$attemptId/resend" -Headers $headers
Invoke-RestMethod -Method Post -Uri "$base/api/auth/logout" -WebSession $webSession
```

The delivery work runs in the background after the shipment/event response is prepared, so a slow webhook does not hold up the shipment status update. Check `GET /api/events` and delivery history to inspect what was recorded. Demo receiver requests are held in process memory and clear when the server restarts.