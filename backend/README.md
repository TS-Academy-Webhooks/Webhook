# Logistics Webhook Backend

Node.js, Express, and MongoDB backend for shipment tracking and webhook delivery.

## Setup

Requirements: Node.js 18 or later and a reachable MongoDB instance.

1. From `backend`, run `npm install`.
2. Create `.env` from `.env.example` if you do not already have a local `.env`.
3. Set `MONGO_URI`, a random `JWT_SECRET` of at least 32 characters, and unique `ADMIN_EMAIL` / `ADMIN_PASSWORD` values (at least 12 characters).
4. Run `npm run dev`. The server waits for MongoDB, assigns legacy accounts the customer role, and creates the bootstrap admin if it does not exist.

The bootstrap admin is created once and is never publicly registerable. Keep its credentials in a secret manager; do not share this account with customers. Set `CORS_ORIGIN` to the exact frontend origin(s), comma-separated. Production also requires HTTPS and non-example JWT/admin secrets. `ALLOW_LOCALHOST_WEBHOOKS=true` permits loopback webhook URLs in development only. The public in-memory demo receiver is disabled in production unless `ENABLE_DEMO_RECEIVER=true`; leave it disabled for deployment. `GET /health` is public and returns:

```json
{"success":true,"message":"API is healthy","data":{"status":"ok"}}
```

## Response format

Every response uses the same envelope. Successful requests use the endpoint's listed status code; errors use `data: null`.

```json
{"success":true,"message":"...","data":{}}
```

```json
{"success":false,"message":"...","data":null}
```

Customer registration creates only customer accounts. Admin accounts are provisioned from environment variables at startup, never through public registration. Customers can create and view only their own shipments; admins can manage all shipments, webhooks, events, and deliveries. Only admins can change shipment status.

Login and registration return a 15-minute `accessToken` for `Authorization: Bearer <accessToken>` and set a 30-day refresh token in an HttpOnly, SameSite cookie. Keep the access token in memory in the frontend; do not store it in `localStorage`. Call `POST /api/auth/refresh` with browser credentials to rotate that cookie and get a new access token. Call `POST /api/auth/logout` to revoke the current refresh session; access tokens are tied to that session, so logout invalidates them immediately. Authenticated users can change their password at `POST /api/auth/change-password`; this revokes every active session for that account. Browser requests to auth endpoints that set/send cookies must use `credentials: "include"` (or the equivalent) and the API must allow the frontend origin.

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
| `PATCH /api/shipments/:id/status` | Admin applies a legal transition and emits an event | Admin | `{ "status": "picked_up" }` | `200`, updated shipment |
| `GET /api/tracking/:trackingNumber` | Public shipment tracking | No | `TRK-` plus five digits | `200`, tracking number, status, locations, timeline, lastUpdated |
| `GET /api/webhooks` | List webhooks; secrets omitted | Admin | None | `200`, webhooks |
| `POST /api/webhooks` | Create webhook | Admin | `{ "name", "url", "events": ["shipment.created"] }` | `201`, webhook and one-time secret |
| `GET /api/webhooks/:id` | Read one webhook; secret omitted | Admin | MongoDB webhook ID | `200`, webhook |
| `PATCH /api/webhooks/:id` | Update name, URL, event subscriptions, or active flag | Admin | Any supported fields | `200`, updated webhook |
| `DELETE /api/webhooks/:id` | Delete webhook | Admin | MongoDB webhook ID | `200`, deleted ID |
| `GET /api/webhooks/:id/deliveries` | List attempts for one webhook | Admin | `page`, `limit`, `status` | `200`, attempts and pagination |
| `GET /api/events` | List events | Admin | `type`, `search` (event ID), `page`, `limit` | `200`, events and pagination |
| `GET /api/events/:id` | Read by MongoDB ID or `evt_` ID | Admin | Event identifier | `200`, event |
| `GET /api/deliveries` | List delivery attempts | Admin | `page`, `limit`, `status`, `webhookId`, `eventId` | `200`, attempts and pagination |
| `GET /api/deliveries/:id` | Read one delivery attempt | Admin | MongoDB attempt ID | `200`, attempt |
| `POST /api/deliveries/:id/resend` | Send that attempt's event to the same existing webhook | Admin | MongoDB attempt ID | `200`, new attempt |
| `POST /api/demo-receiver` | Store received headers/body and check signature when possible; development only by default | No | Any JSON webhook body | `201`, received request |
| `GET /api/demo-receiver` | List requests received by this running process; development only by default | No | None | `200`, received requests |
| `POST /api/demo-receiver/fail` | Deliberately return a failure to exercise retries; development only by default | No | Any | `500`, error envelope |

Common errors: `400` invalid input or illegal transition, `401` missing/invalid access or refresh token, `403` authenticated role lacks permission, `404` missing or non-owned record, `409` duplicate unique value, `429` rate limit, and `500` unexpected server error. Customer tracking intentionally excludes the customer name, amount, MongoDB ID, and internal fields.

Access tokens are bound to a database refresh-session record. Refresh tokens are random, stored only as SHA-256 hashes, rotated atomically on refresh, and revoked at logout. Existing users without a role are migrated to customers at startup; existing shipments without `customerId` remain admin-only until assigned through the admin shipment-customer endpoint. Public registration ignores any submitted role and always creates a customer.

Before opening customer registration to production traffic, add provider-backed email verification and password recovery. Those flows are not enabled because no email delivery provider or sender configuration has been selected.

## Shipment statuses

`created -> picked_up -> in_transit -> arrived_at_hub -> out_for_delivery -> delivered`

`arrived_at_hub` can return to `in_transit`; `out_for_delivery` can become `delivery_failed`, which can return to `out_for_delivery` or be cancelled. `created`, `picked_up`, `in_transit`, and `arrived_at_hub` can be cancelled. `delivered` and `cancelled` are final. Invalid transitions return `400`.

## Webhook delivery and security

Each matching active webhook receives a POST with a five-second timeout. The backend serializes the event payload once and computes HMAC-SHA256 over that exact JSON string, then sends the same string as the request body with `X-Webhook-Signature`. The receiver must verify the raw request body: parsing and re-serializing JSON can change whitespace or property order, which changes the signature. Any 2xx response succeeds; other statuses and network errors fail. Failed automatic deliveries are recorded and retried after 2 and 5 seconds, for at most three total attempts. Responses are truncated to 1000 characters.

The webhook secret is generated with cryptographic randomness, returned only when creating the webhook, and excluded from later queries. Store it securely. Webhook URLs can otherwise be abused to make the server contact internal services (SSRF). Production validation resolves hostnames and blocks localhost/private addresses; development localhost access requires `ALLOW_LOCALHOST_WEBHOOKS=true`. DNS can change after validation, so production deployments should also restrict outbound network access.

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
Invoke-RestMethod -Method Get -Uri "$base/api/demo-receiver" # Inspect received body and signatureValid.

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
$attemptId = $attempts.data.deliveries[0]._id
Invoke-RestMethod -Method Post -Uri "$base/api/deliveries/$attemptId/resend" -Headers $headers
Invoke-RestMethod -Method Post -Uri "$base/api/auth/logout" -WebSession $webSession
```

The delivery work runs in the background after the shipment/event response is prepared, so a slow webhook does not hold up the shipment status update. Check `GET /api/events` and delivery history to inspect what was recorded. Demo receiver requests are held in process memory and clear when the server restarts.