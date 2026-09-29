# Logistics Webhook Backend

Node.js, Express, and MongoDB backend for shipment tracking and webhook delivery.

## Setup

Requirements: Node.js 18 or later and a reachable MongoDB instance.

1. From `backend`, run `npm install`.
2. Create `.env` from `.env.example` if you do not already have a local `.env`.
3. Set `MONGO_URI` and replace `JWT_SECRET` with a long random value.
4. Run `npm run dev`. The server waits for MongoDB before it listens.

`ALLOW_LOCALHOST_WEBHOOKS=true` permits loopback webhook URLs in development so the demo receiver can be used. Do not use this setting in production. `CORS_ORIGIN` accepts one origin or a comma-separated list. `GET /health` is public and returns:

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

Protected endpoints require `Authorization: Bearer <token>`. Registration and login return a one-day JWT. There are no roles or per-user ownership rules: an authenticated user can manage all records.

## API reference

| Method and path | Purpose | Auth | Body or query | Success |
| --- | --- | --- | --- | --- |
| `POST /api/auth/register` | Create the single-system account | No | `{ "name", "email", "password" }`; password min 8 chars | `201`, user and token |
| `POST /api/auth/login` | Sign in | No | `{ "email", "password" }` | `200`, user and token |
| `GET /api/auth/me` | Read current user | Yes | None | `200`, user |
| `GET /api/shipments` | List shipments | Yes | `search`, `status`, `page`, `limit` (max 100) | `200`, shipments and pagination |
| `POST /api/shipments` | Create shipment and `shipment.created` event | Yes | `{ "customer", "origin", "destination", "amount" }` | `201`, shipment |
| `GET /api/shipments/:id` | Read one shipment | Yes | MongoDB shipment ID | `200`, shipment |
| `PATCH /api/shipments/:id/status` | Apply a legal status transition and emit an event | Yes | `{ "status": "picked_up" }` | `200`, updated shipment |
| `GET /api/tracking/:trackingNumber` | Public shipment tracking | No | `TRK-` plus five digits | `200`, tracking number, status, locations, timeline, lastUpdated |
| `GET /api/webhooks` | List webhooks; secrets omitted | Yes | None | `200`, webhooks |
| `POST /api/webhooks` | Create webhook | Yes | `{ "name", "url", "events": ["shipment.created"] }` | `201`, webhook and one-time secret |
| `GET /api/webhooks/:id` | Read one webhook; secret omitted | Yes | MongoDB webhook ID | `200`, webhook |
| `PATCH /api/webhooks/:id` | Update name, URL, event subscriptions, or active flag | Yes | Any supported fields | `200`, updated webhook |
| `DELETE /api/webhooks/:id` | Delete webhook | Yes | MongoDB webhook ID | `200`, deleted ID |
| `GET /api/webhooks/:id/deliveries` | List attempts for one webhook | Yes | `page`, `limit`, `status` | `200`, attempts and pagination |
| `GET /api/events` | List events | Yes | `type`, `search` (event ID), `page`, `limit` | `200`, events and pagination |
| `GET /api/events/:id` | Read by MongoDB ID or `evt_` ID | Yes | Event identifier | `200`, event |
| `GET /api/deliveries` | List delivery attempts | Yes | `page`, `limit`, `status`, `webhookId`, `eventId` | `200`, attempts and pagination |
| `GET /api/deliveries/:id` | Read one delivery attempt | Yes | MongoDB attempt ID | `200`, attempt |
| `POST /api/deliveries/:id/resend` | Send that attempt's event to the same existing webhook | Yes | MongoDB attempt ID | `200`, new attempt |
| `POST /api/demo-receiver` | Store received headers/body and check signature when possible | No | Any JSON webhook body | `201`, received request |
| `GET /api/demo-receiver` | List requests received by this running process | No | None | `200`, received requests |
| `POST /api/demo-receiver/fail` | Deliberately return a failure to exercise retries | No | Any | `500`, error envelope |

Common errors: `400` invalid input or illegal transition, `401` missing/invalid token, `404` missing record, `409` duplicate unique value, `429` rate limit, and `500` unexpected server error. Customer tracking intentionally excludes the customer name, amount, MongoDB ID, and internal fields.

## Shipment statuses

`created -> picked_up -> in_transit -> arrived_at_hub -> out_for_delivery -> delivered`

`arrived_at_hub` can return to `in_transit`; `out_for_delivery` can become `delivery_failed`, which can return to `out_for_delivery` or be cancelled. `created`, `picked_up`, `in_transit`, and `arrived_at_hub` can be cancelled. `delivered` and `cancelled` are final. Invalid transitions return `400`.

## Webhook delivery and security

Each matching active webhook receives a POST with a five-second timeout. The backend serializes the event payload once and computes HMAC-SHA256 over that exact JSON string, then sends the same string as the request body with `X-Webhook-Signature`. The receiver must verify the raw request body: parsing and re-serializing JSON can change whitespace or property order, which changes the signature. Any 2xx response succeeds; other statuses and network errors fail. Failed automatic deliveries are recorded and retried after 2 and 5 seconds, for at most three total attempts. Responses are truncated to 1000 characters.

The webhook secret is generated with cryptographic randomness, returned only when creating the webhook, and excluded from later queries. Store it securely. Webhook URLs can otherwise be abused to make the server contact internal services (SSRF). Production validation resolves hostnames and blocks localhost/private addresses; development localhost access requires `ALLOW_LOCALHOST_WEBHOOKS=true`. DNS can change after validation, so production deployments should also restrict outbound network access.

## End-to-end checklist (PowerShell)

Run with the backend at `http://localhost:3000`, MongoDB available, and development localhost webhooks enabled. These commands use `Invoke-RestMethod`, which parses the response JSON.

```powershell
$base = "http://localhost:3000"
$account = Invoke-RestMethod -Method Post -Uri "$base/api/auth/register" -ContentType "application/json" -Body (@{ name = "Demo User"; email = "demo@example.com"; password = "demo-password-123" } | ConvertTo-Json)
$headers = @{ Authorization = "Bearer $($account.data.token)" }

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
```

The delivery work runs in the background after the shipment/event response is prepared, so a slow webhook does not hold up the shipment status update. Check `GET /api/events` and delivery history to inspect what was recorded. Demo receiver requests are held in process memory and clear when the server restarts.