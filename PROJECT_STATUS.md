# Logistics Webhook Platform

## Team Update

The backend API is implemented with Node.js, Express, and MongoDB. It supports shipment management, shipment status history, event creation, webhook management and delivery, retries, delivery logs, public tracking, and customer/admin authentication.

The automated backend suite currently passes 7 tests. The auth and ownership flows have also been exercised against MongoDB. The live development API is available locally at `http://localhost:3000` when the backend is running.

## Backend Progress

- Customers can register and manage only shipments assigned to their account.
- Admin accounts are created from private environment configuration. Admins can manage all shipments, assign existing shipments to customers, update shipment statuses, and manage webhooks, events, and deliveries.
- Authentication uses short-lived access tokens and rotating refresh tokens in HttpOnly cookies. Logout and password changes revoke sessions.
- Shipment status transitions are validated and recorded in the shipment timeline.
- Shipment events trigger signed webhook requests. Failed requests are recorded and retried, and admins can manually resend deliveries.
- Public tracking returns a limited shipment view without customer or internal fields.
- A demo webhook receiver is available during development and disabled in production by default.

## Frontend Handoff

- Register: `POST /api/auth/register` with `{ "name", "email", "password" }`. Registration always creates a customer account.
- Login: `POST /api/auth/login` with `{ "email", "password" }`. The JSON response contains `data.accessToken`; the refresh token is set as an HttpOnly cookie.
- Protected API calls send `Authorization: Bearer <accessToken>`.
- Browser requests that set, refresh, or clear the refresh cookie must use `credentials: "include"` (or `withCredentials: true`) and the API must allow the frontend's exact CORS origin.
- Keep the short-lived access token in memory rather than `localStorage`. Call `POST /api/auth/refresh` to rotate the refresh cookie and receive another access token. Call `POST /api/auth/logout` to revoke the session.
- `GET /api/auth/me` returns the signed-in user's profile and role.
- Customers can create shipments with `origin`, `destination`, and `amount`; the backend assigns the customer identity. Customers can list and view only their own shipments.
- Shipment status changes and webhook/event/delivery administration are admin-only. Public tracking uses `GET /api/tracking/:trackingNumber` and does not require a token.

Full endpoint details and sample requests are in [backend/README.md](backend/README.md).

## Before Production

- Rotate any database, JWT, or admin credentials that have been shared, and keep the replacements in a secret manager or deployment environment. Never commit `.env`.
- Set `NODE_ENV=production`, a strong `JWT_SECRET`, dedicated bootstrap admin credentials, HTTPS, and the exact production `CORS_ORIGIN`.
- Keep `ALLOW_LOCALHOST_WEBHOOKS` disabled and `ENABLE_DEMO_RECEIVER` disabled in production.
- Add provider-backed email verification and password recovery before opening registration to the public. Multi-factor authentication is not implemented.
- Run `npm test` from `backend` before merging or deploying.