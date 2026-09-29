# Logistics Webhook Backend

## Setup

Requirements: Node.js and a running MongoDB instance.

1. From the `backend` directory, install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set `MONGO_URI` to your MongoDB connection string.
3. Start the development server with `npm run dev`.

The server waits for MongoDB before listening. If the database connection fails, check that MongoDB is running and that `MONGO_URI` is correct.

## Health check

With the server running, request `GET http://localhost:3000/health`:

```json
{
  "success": true,
  "message": "API is healthy",
  "data": {
    "status": "ok"
  }
}
```