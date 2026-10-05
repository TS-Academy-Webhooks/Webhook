# Project Architecture

Waybridge is a single-origin Express + Vite application for shipment tracking and webhook delivery. `backend/` is the canonical API and production web server; `frontend/` is the React application. `backend-my-part/` is retired and is not a runtime dependency.

## Runtime model

- In development, Vite runs on port `5173` and proxies `/api` to Express on port `3000`.
- In production, build the Vite app into `frontend/dist`; Express serves those assets and the API from one HTTPS origin.
- MongoDB holds users, sessions, shipments, events, webhooks, deliveries, and delivery attempts. Backend startup applies the documented, idempotent legacy-field migration.
- The backend serves the API contract and interactive Swagger UI; see [backend/README.md](backend/README.md).

## Product areas

- Public: marketing, product documentation, and shipment tracking.
- Customer: account access, own shipments, webhook endpoints, and delivery visibility.
- Admin: shipment operations and assignment, platform events and delivery operations, and demo-receiver administration.
- Shared: responsive dashboard/navigation, account appearance and profile settings, event and delivery history.

API-key management and provider-backed email verification/password recovery are deferred because their backend contracts and provider configuration do not exist. The interface must not simulate those operations as successful.

## Security and data

Public registration creates customers only; admins are provisioned from private environment variables. The browser keeps short-lived access tokens in memory and uses an HttpOnly refresh cookie. Production must use HTTPS, strong non-example secrets, an exact configured origin, and safe webhook URL policy. Keep local webhook and demo-receiver options disabled in production unless intentionally required.

Back up MongoDB before a deployment that runs legacy migrations. The backend migration guide documents transformed fields and any sign-in/API compatibility impact. Never commit `.env` files or bootstrap credentials.

## Development references

`davinci/` is the reference for the merged backend contract, compatibility behavior, migrations, and API docs. `chadman/` is the reference for full-platform screens and responsive UX; the production frontend remains Vite + React Router.
