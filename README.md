# Logistics Webhook Platform

A learning project for shipment management and event-driven webhooks. The backend is built with Node.js, Express, and MongoDB. The frontend is maintained separately in `frontend/`.

## What It Does

- Customers can register, sign in, and manage shipments assigned to their account.
- Admins can manage all shipments, assign shipments to customers, and manage webhooks, events, and deliveries.
- Shipment status changes create timeline entries and events.
- Matching webhooks receive signed HTTP requests, with recorded attempts, automatic retries, and manual resend.
- Public tracking exposes a limited shipment view without customer or internal data.

## Backend Quick Start

Requirements: Node.js 18 or later and a reachable MongoDB database.

1. Open `backend/` and install dependencies with `npm install`.
2. Create `backend/.env` from `backend/.env.example` and configure the MongoDB URI, JWT secret, and bootstrap admin credentials. Never commit `.env` or share its secrets.
3. Start the API from `backend/` with `npm run dev`.
4. Run backend tests with `npm test`.

The local API defaults to `http://localhost:3000`; `GET /health` checks that it is responding. The demo webhook receiver is for development and is disabled in production by default.

## Documentation

- [Backend setup, API reference, and end-to-end checklist](backend/README.md)
- [Project progress and frontend handoff](PROJECT_STATUS.md)

## Security Notes

Public registration creates customer accounts only. Admin credentials are bootstrapped from environment variables and must be unique and private. Before deployment, use HTTPS, rotate any credentials that have been exposed, configure the production frontend origin, and keep demo/local webhook options disabled.