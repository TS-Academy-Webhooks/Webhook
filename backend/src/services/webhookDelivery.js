const crypto = require("crypto");
const Event = require("../models/event");
const Webhook = require("../models/webhook");
const DeliveryAttempt = require("../models/DeliveryAttempt");
const validateWebhookUrl = require("../utils/validateWebhookUrl");

const REQUEST_TIMEOUT_MS = 5000;

async function deliverToWebhook(webhook, event, body) {
  const startedAt = Date.now();
  const attemptedAt = new Date(startedAt);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let httpStatus;
  let responseText = "";
  let status = "failed";

  try {
    const url = await validateWebhookUrl(webhook.url);
    const signature = crypto.createHmac("sha256", webhook.secret).update(body).digest("hex");
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Webhook-Signature": signature },
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
    attemptNumber: 1,
    status,
    httpStatus,
    response: responseText,
    duration: Date.now() - startedAt,
    attemptedAt,
  });
}

async function deliverEvent(eventDocumentId) {
  try {
    const event = await Event.findById(eventDocumentId);
    if (!event) {
      throw new Error("Event " + eventDocumentId + " was not found");
    }

    const webhooks = await Webhook.find({ events: event.type, active: true }).select("+secret");
    const body = JSON.stringify(event.payload);
    for (const webhook of webhooks) {
      try {
        await deliverToWebhook(webhook, event, body);
      } catch (error) {
        console.error("Webhook delivery failed for " + webhook.name + ":", error.message);
      }
    }
  } catch (error) {
    console.error("Error starting webhook deliveries:", error.message);
  }
}

module.exports = deliverEvent;
