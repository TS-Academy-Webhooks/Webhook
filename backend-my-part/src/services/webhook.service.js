const crypto = require("crypto");
const Webhook = require("../models/Webhook");

// Finds every active webhook subscribed to this event type (or to "*").
// Used by event.service.js whenever a new event needs to be dispatched.
function findMatchingWebhooks(eventType) {
  return Webhook.find({
    isActive: true,
    events: { $in: [eventType, "*"] },
  });
}

function generateSecret() {
  return `whsec_${crypto.randomBytes(24).toString("hex")}`;
}

// Masks all but the last 4 characters of a secret, for list views,
// so the full secret is only ever shown when fetching one webhook by ID.
function maskSecret(secret) {
  if (!secret) return null;
  return secret.slice(0, 6) + "****" + secret.slice(-4);
}

module.exports = { findMatchingWebhooks, generateSecret, maskSecret };
