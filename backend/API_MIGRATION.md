# Backend merge and migration guide

Express in `backend/` is the canonical production server. The old `backend-my-part/` implementation is retired after its API behavior and stored-data formats are covered here. Build the Vite app before deployment; when `frontend/dist` is present, Express serves static and prerendered pages after API, health, and Swagger routes. Without a build, API development and tests still run.

## Before the first deployment

1. Take and verify a restorable backup of the MongoDB database before starting this version. Startup migration runs before Express begins listening.
2. Confirm `MONGO_URI`, the existing bootstrap admin identity, a unique strong `JWT_SECRET`, and production `CORS_ORIGIN`/HTTPS settings. Do not point `ADMIN_EMAIL` at a legacy non-admin account; startup deliberately refuses to silently promote customer accounts.
3. Deploy and monitor the startup migration log. The migration uses idempotent field updates and may be safely rerun; keep the backup until API behavior and ownership assignments have been checked.
4. If rollback is needed, restore the pre-migration database backup together with the matching previous backend version.

The migration preserves existing password hashes. It does **not** migrate access tokens or refresh sessions: the new backend requires short-lived JWTs bound to database-backed, revocable sessions. All existing users must sign in again after deployment. Browser clients must keep access tokens in memory and send auth requests with credentials enabled so the HttpOnly refresh cookie can rotate. Public registration and password changes now require at least 12 characters.

## Idempotent stored-data mappings

| Earlier stored fields | Canonical fields | Migration behavior |
| --- | --- | --- |
| `User.password`, `role: user/merchant/operations` or missing role | `passwordHash`, `role: customer` | Moves existing hashes without rehashing; retains `admin`, maps other roles to customer, and removes the old password field. |
| `Shipment.timeline[]` (`at`, `note`), `createdBy` | `statusHistory[]` (`timestamp`, `note`), `customerId` | Converts each timeline entry. Assigns only shipments created by a customer to that creator; unassigned/admin-created shipments remain admin-visible until assigned. |
| `Event.shipment` | `Event.shipmentId` | Copies the reference and removes the legacy field. Shipment-less webhook test events are supported. |
| `Webhook.user`, `active`; ownerless shared-backend hooks | `ownerId`, `isActive` | Retains a valid legacy owner; assigns ownerless or orphaned hooks to the configured bootstrap admin; defaults active state to true. |
| Legacy `Delivery.event`, `webhook`, `user` | `eventId`, `webhookId`, `ownerId` | Normalizes summary records and retains status, retry count, and timestamps. |
| `DeliveryAttempt.delivery`, `statusCode`, `responseBody`, `durationMs` | `deliveryId`, `httpStatus`, `response`, `duration` | Normalizes linked attempts. Shared-backend attempts that had no summary are grouped by webhook/event into delivery summaries and linked by `deliveryId`. |

The database update path removes migrated aliases from stored documents, while Mongoose/API serialization continues to expose additive aliases such as `id`, `timeline`, `user`, `active`, `event`, `webhook`, `statusCode`, `responseBody`, and `durationMs`. Do not use the legacy field aliases as migration markers.

## Client/API compatibility

- Success/error envelopes remain `{ success, message, data }`; validation errors additionally return `errors[]`.
- Paginated lists retain their resource-named arrays and add `items`; `pagination.totalItems` and `pagination.total` are aliases. MongoDB `_id` is retained alongside `id`.
- Webhooks and deliveries are owner-scoped for customers; admins retain access to all records. `active`/`isActive`, `PATCH`/`PUT`, wildcard (`"*"`) subscriptions, secret regeneration, and `POST /api/webhooks/:id/test` are supported. Secrets are returned in full only on create or explicit regeneration; subsequent reads are masked.
- Delivery lists now contain per-webhook/event summaries (`pending`, `success`, `failed`); summary detail and webhook-specific history include nested individual attempts. The former attempt field names remain aliases. Detail and resend/retry endpoints accept a historical attempt ID as well as a summary ID; queued resend/retry returns `202`.
- Outgoing webhooks retain this repository's existing contract: the body is the exact JSON serialization of `event.payload`, and `X-Webhook-Signature` is the unprefixed lowercase-hex HMAC-SHA256 of those raw bytes. No envelope, timestamp, or extra signature headers are emitted. The demo receiver can additionally verify davinci's timestamped-envelope format when receiving it, but adopting that format for outgoing deliveries would be a breaking change and requires an explicit, coordinated protocol version change.
- `/api/health` is additive to `/health`. `/api-docs` provides Swagger UI and `/api-docs/openapi.yaml` the OpenAPI contract; `/docs` is the public Vite developer guide.

## Security and operations retained

The merged backend keeps 15-minute session-bound access tokens, hashed and rotating HttpOnly refresh cookies, password-change/logout revocation, customer/admin role checks, auth/tracking limits, admin bootstrap, request validation, and bounded JSON bodies. Customer-owned hooks receive only events for shipments assigned to that customer; admin-owned hooks retain platform-wide event delivery. Webhook URL validation still blocks unsafe production destinations and rejects embedded credentials; delivery validates the URL again and does not follow redirects. DNS rebinding still requires outbound network restrictions at deployment. The demo receiver is in-memory, rate-limited for public POSTs, development-enabled by default, and production-disabled unless explicitly enabled; its history and configuration endpoints require an admin.
