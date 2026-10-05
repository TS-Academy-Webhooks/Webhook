# Waybridge Logistics Webhook Platform

Waybridge combines shipment management, public tracking, and signed webhook delivery in one Express + React application. The Vite frontend and Express API remain separate packages for development, while production Express serves the built frontend and `/api` from the same origin.

## Features

- Customer registration, sign-in, profile, and customer-owned shipments.
- Admin shipment operations, status history, and public tracking.
- Webhook subscriptions, signed deliveries, retry history, and manual resend.
- Event and delivery inspection, plus a development demo receiver.
- Public marketing and documentation pages with crawlable metadata.

## Requirements

- Node.js 20.19+ in the 20.x line, or 22.12+.
- MongoDB, local or hosted.

## Local development

1. Install backend dependencies with `npm ci --prefix backend`.
2. Install frontend dependencies with `npm ci --prefix frontend`.
3. Copy `backend/.env.example` to `backend/.env` and set `MONGO_URI`, a random `JWT_SECRET` of at least 32 characters, unique `ADMIN_EMAIL` and `ADMIN_PASSWORD` values (at least 12 characters), and `CORS_ORIGIN=http://localhost:5173`.
4. Start the API in one terminal: `npm run dev:api`.
5. Start Vite in another terminal: `npm run dev:frontend`.

Open the Vite URL printed in the frontend terminal (normally `http://localhost:5173`). Vite proxies `/api` requests to the Express server (normally `http://localhost:3000`), so browser requests and refresh cookies use the same frontend origin during development. The backend can be checked at `http://localhost:3000/health`; interactive API docs are at `http://localhost:3000/api-docs`.

## Production

Build the frontend, then start Express:

```powershell
$env:VITE_SITE_URL = "https://your-site.example"
npm run build
$env:NODE_ENV = "production"
$env:CORS_ORIGIN = $env:VITE_SITE_URL
npm start
```

Configure all backend secrets in the deployment environment and set the public site's exact origin for `CORS_ORIGIN` and the frontend's `VITE_SITE_URL` at build time. Express serves the generated frontend and API from the same HTTPS origin. Set `ALLOW_LOCALHOST_WEBHOOKS=false` and leave `ENABLE_DEMO_RECEIVER=false` unless the receiver is intentionally enabled for the deployment. Back up MongoDB before starting a version that applies the merged legacy-data migration.

## Verification

```powershell
npm test
npm run lint
npm run build
```

## Documentation

- [Backend setup, API contract, migration, and webhook security](backend/README.md)
- [Project architecture and current implementation notes](PROJECT_STATUS.md)
- OpenAPI and Swagger UI are available from the running backend.

Public registration always creates a customer account. Admin access is provisioned from private environment configuration; never commit `.env` files or share bootstrap credentials. Access tokens remain in memory in the browser and refresh tokens are HttpOnly cookies. Provider-backed password recovery and API-key management are not available until their backend contracts exist.
