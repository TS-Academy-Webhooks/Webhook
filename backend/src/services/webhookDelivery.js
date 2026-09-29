const crypto = require("crypto");
const Event = require("../models/event");
const Webhook = require("../models/webhook");
const DeliveryAttempt = require("../models/DeliveryAttempt");
const validateWebhookUrl = require("../utils/validateWebhookUrl");

const REQUEST_TIMEOUT_MS = 5000;
const RETRY_DELAYS_MS = [2000, 5000];

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function deliverWebhookOnce(webhook, event, attemptNumber, body) {
  const startedAt = Date.now();
  const attemptedAt = new Date(startedAt);
  let httpStatus;
  let responseText = "";
  let status = "failed";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const url = await validateWebhookUrl(webhook.url);
    const signature = crypto
      .createHmac("sha256", webhook.secret)
      .update(body)
      .digest("hex");
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
      },
      body,
      signal: controller.signal,
    });

    httpStatus = response.status;
    responseText = (await response.text()).slice(0, 1000);
    status = response.ok ? "success" : "failed";
  } catch (error) {
    responseText = (error.name === "AbortError" ? "Request timed out" : error.message).slice(0, 1000);
  } finally {
    clearTimeout(timeout);
  }

  return DeliveryAttempt.create({
    webhookId: webhook._id,
    eventId: event._id,
    attemptNumber,
    status,
    httpStatus,
    response: responseText,
    duration: Date.now() - startedAt,
    attemptedAt,
  });
}

async function deliverWebhookWithRetries(webhook, event, firstAttemptNumber) {
  const body = JSON.stringify(event.payload);
  let attempt;

  for (let retryIndex = 0; retryIndex <= RETRY_DELAYS_MS.length; retryIndex += 1) {
    attempt = await deliverWebhookOnce(webhook, event, firstAttemptNumber + retryIndex, body);
    if (attempt.status === "success" || retryIndex === RETRY_DELAYS_MS.length) {
      return attempt;
    }
    await delay(RETRY_DELAYS_MS[retryIndex]);
  }

  return attempt;
}

async function deliverEvent(eventDocumentId) {
  try {
    const event = await Event.findById(eventDocumentId);
    if (!event) {
      throw new Error(`Event ${eventDocumentId} was not found`);
    }

    const webhooks = await Webhook.find({
      events: event.type,
      active: true,
    }).select("+secret");

    for (const webhook of webhooks) {
      try {
        const previousAttempts = await DeliveryAttempt.countDocuments({
          webhookId: webhook._id,
          eventId: event._id,
        });
        await deliverWebhookWithRetries(webhook, event, previousAttempts + 1);
      } catch (error) {
        console.error(`Webhook delivery failed for ${webhook.name}:`, error.message);
      }
    }
  } catch (error) {
    console.error("Error starting webhook deliveries:", error.message);
  }
}

async function resendWebhookOnce(webhook, event, attemptNumber) {
  return deliverWebhookOnce(webhook, event, attemptNumber, JSON.stringify(event.payload));
}

module.exports = deliverEvent;
module.exports.deliverWebhookWithRetries = deliverWebhookWithRetries;
module.exports.resendWebhookOnce = resendWebhookOnce;
module.exports.REQUEST_TIMEOUT_MS = REQUEST_TIMEOUT_MS;
module.exports.RETRY_DELAYS_MS = RETRY_DELAYS_MS;