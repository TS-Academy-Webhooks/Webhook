# Waybridge frontend

Waybridge is a responsive Vite + React Router application. It is developed as a separate package from Express, but the production backend serves `frontend/dist` and its `/api` endpoints from one origin.

## Development

From the repository root, install dependencies once with `npm ci --prefix frontend` and `npm ci --prefix backend`. Copy `backend/.env.example` to `backend/.env` and configure MongoDB, JWT/admin secrets, and `CORS_ORIGIN=http://localhost:5173`. Start `npm run dev:api` and `npm run dev:frontend` in separate terminals.

Vite proxies `/api` and `/api-docs` to Express on `http://localhost:3000`. The React app itself uses the relative `/api` path, so the browser and HttpOnly refresh cookie stay on the Vite origin in development. The public developer guide is `/docs`; Swagger UI is available on the API server at `/api-docs`.

## Routes and permissions

Public routes are `/`, `/about`, `/docs`, and `/track` (with `/track/:trackingNumber` for lookup results). Authenticated customers can see their assigned shipments, own webhooks, and own deliveries; administrator-only actions include shipment status changes, event browsing, and demo-receiver inspection/configuration. Unsupported API-key management and email-backed password recovery are explicitly unavailable.

Access tokens are kept in memory only. On initial load, the app rotates the HttpOnly refresh cookie through `POST /api/auth/refresh`; protected requests retry once after a 401 if session refresh succeeds. Logout revokes the server session and clears local in-memory auth. Do not persist access or refresh tokens in browser storage.

## Build, prerendering, and SEO

Run `npm run build` from the repository root (or `npm run build` in `frontend/`). Vite builds the client, then `scripts/prerender.mjs` renders the public landing, About, Docs, and Track pages to `dist/`. Set `VITE_SITE_URL` to the deployed HTTPS site origin before building to configure canonical URLs, social-card metadata, and the public sitemap. The build also writes `robots.txt`; private routes receive `noindex, nofollow` metadata and are omitted from the sitemap.

The frontend build requires Node.js 20.19+ in the 20.x line, or 22.12+.

Express serves prerendered files such as `/about/` and `/docs/` directly. Other client-side application routes fall back to the Vite shell after API, health, and Swagger routes. Keep `/api` unknown-route responses as JSON 404s; they must never be served the application shell.

## Verification

Run `npm run lint` and `npm run build` from the repository root. Backend API and static-serving tests run with `npm test`.
