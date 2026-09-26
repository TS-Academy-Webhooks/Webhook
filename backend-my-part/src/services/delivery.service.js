const crypto = require("crypto");
const axios = require("axios");
const { DeliveryAttempt } = require("../models/Delivery");

const REQUEST_TIMEOUT_MS = 5000;

// Builds the exact request body sent to the receiver.
function buildDeliveryBody(event) {
  return {
    id: event.eventId,
    type: event.type,
    createdAt: event.createdAt,
    data: event.payload,
  };
}

// Signs the body with the webhook's secret, HMAC-SHA256.
// The receiver recomputes this using the same secret to verify authenticity.
function signBody(rawBody, timestamp, secret) {
  return (
    "sha256=" +
    crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex")
  );
}

// Makes exactly ONE HTTP attempt and records it as a DeliveryAttempt.
// Returns true if it succeeded (2xx response).
// Retrying belongs to retry.service.js — this function only ever tries once.
async function makeOneAttempt(delivery, webhook, event, attemptNumber) {
  const body = buildDeliveryBody(event);
  const rawBody = JSON.stringify(body);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = signBody(rawBody, timestamp, webhook.secret);

  const startedAt = Date.now();
  let result;

  try {
    const response = await axios.post(webhook.url, rawBody, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "LogisticsWebhookPlatform/1.0",
        "X-Webhook-Event": event.type,
        "X-Webhook-Delivery": String(delivery._id),
        "X-Webhook-Timestamp": timestamp,
        "X-Webhook-Signature": signature,
      },
      timeout: REQUEST_TIMEOUT_MS,
      validateStatus: () => true, // we decide success/failure ourselves below
    });

    const durationMs = Date.now() - startedAt;
    const success = response.status >= 200 && response.status < 300;

    result = {
      status: success ? "success" : "failed",
      statusCode: response.status,
      responseBody:
        typeof response.data === "string"
          ? response.data.slice(0, 1000)
          : JSON.stringify(response.data).slice(0, 1000),
      errorMessage: success ? null : `Receiver responded with status ${response.status}`,
      durationMs,
    };
  } catch (err) {
    const durationMs = Date.now() - startedAt;
    result = {
      status: "failed",
      statusCode: null,
      responseBody: null,
      errorMessage:
        err.code === "ECONNABORTED" ? "Request timed out" : err.message || "Request failed",
      durationMs,
    };
  }

  await DeliveryAttempt.create({
    delivery: delivery._id,
    attemptNumber,
    ...result,
  });

  return result.status === "success";
}

module.exports = { buildDeliveryBody, signBody, makeOneAttempt };
