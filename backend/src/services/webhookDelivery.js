const crypto = require("crypto");
const Delivery = require("../models/Delivery");
const DeliveryAttempt = require("../models/DeliveryAttempt");
const Event = require("../models/event");
const Webhook = require("../models/webhook");
const validateWebhookUrl = require("../utils/validateWebhookUrl");

const REQUEST_TIMEOUT_MS = 5000;
const RETRY_DELAYS_MS = [2000, 5000];

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function buildDeliveryBody(event) {
  return event.payload;
}

function signBody(rawBody, secret) {
  return crypto.createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
}

function canDeliverToWebhook(webhook, event) {
  const owner = webhook.ownerId;
  if (owner?.role === "admin") return true;
  const shipmentOwnerId = event.shipmentId?.customerId;
  const webhookOwnerId = owner?._id || owner;
  return Boolean(shipmentOwnerId && webhookOwnerId &&
    String(shipmentOwnerId) === String(webhookOwnerId));
}

async function readResponsePreview(response) {
  if (!response.body?.getReader) {
    return (await response.text()).slice(0, 1000);
  }

  const reader = response.body.getReader();
  const chunks = [];
  let byteLength = 0;
  let reachedEnd = false;
  try {
    while (byteLength < 1000) {
      const { done, value } = await reader.read();
      if (done) {
        reachedEnd = true;
        break;
      }
      const remaining = 1000 - byteLength;
      const chunk = Buffer.from(value.subarray(0, remaining));
      chunks.push(chunk);
      byteLength += chunk.length;
      if (chunk.length < value.length) break;
    }
  } finally {
    if (!reachedEnd) {
      void reader.cancel().catch(() => {});
    }
  }
  return Buffer.concat(chunks).toString("utf8").slice(0, 1000);
}

async function deliverWebhookOnce(delivery, webhook, event, attemptNumber) {
  const startedAt = Date.now();
  const attemptedAt = new Date(startedAt);
  const body = JSON.stringify(buildDeliveryBody(event));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let httpStatus;
  let responseText = "";
  let errorMessage = "";

  try {
    const url = await validateWebhookUrl(webhook.url);
    const response = await fetch(url, {
      method: "POST",
      redirect: "manual",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signBody(body, webhook.secret),
      },
      body,
      signal: controller.signal,
    });

    httpStatus = response.status;
    responseText = await readResponsePreview(response);
    if (!response.ok) {
      errorMessage = `Receiver responded with status ${response.status}`;
    }
  } catch (error) {
    errorMessage = (
      error.name === "AbortError" ? "Request timed out" : error.message || "Request failed"
    ).slice(0, 1000);
  } finally {
    clearTimeout(timeout);
  }

  const status = !errorMessage && httpStatus >= 200 && httpStatus < 300
    ? "success"
    : "failed";
  return DeliveryAttempt.create({
    deliveryId: delivery._id,
    webhookId: webhook._id,
    eventId: event._id,
    attemptNumber,
    status,
    httpStatus,
    response: responseText,
    errorMessage,
    duration: Date.now() - startedAt,
    attemptedAt,
  });
}

async function processDelivery(deliveryId) {
  const delivery = await Delivery.findById(deliveryId);
  if (!delivery || delivery.status === "success") return delivery;

  const [webhook, event] = await Promise.all([
    Webhook.findById(delivery.webhookId).select("+secret"),
    Event.findById(delivery.eventId),
  ]);
  if (!webhook || !event) {
    delivery.status = "failed";
    await delivery.save();
    return delivery;
  }

  while (delivery.attemptCount < delivery.maxAttempts) {
    const attemptNumber = delivery.attemptCount + 1;
    const attempt = await deliverWebhookOnce(delivery, webhook, event, attemptNumber);
    delivery.attemptCount = attemptNumber;
    delivery.lastAttemptAt = attempt.attemptedAt;
    if (attempt.status === "success") {
      delivery.status = "success";
      await delivery.save();
      return delivery;
    }

    if (delivery.attemptCount < delivery.maxAttempts) {
      delivery.status = "pending";
      await delivery.save();
      await delay(RETRY_DELAYS_MS[delivery.attemptCount - 1] || RETRY_DELAYS_MS.at(-1));
    }
  }

  delivery.status = "failed";
  await delivery.save();
  return delivery;
}

async function deliverEvent(eventDocumentId) {
  const event = await Event.findById(eventDocumentId)
    .populate("shipmentId", "customerId");
  if (!event) {
    throw new Error(`Event ${eventDocumentId} was not found`);
  }

  const webhooks = await Webhook.find({
    isActive: true,
    events: { $in: [event.type, "*"] },
  }).populate("ownerId", "role");
  for (const webhook of webhooks.filter((candidate) => canDeliverToWebhook(candidate, event))) {
    const delivery = await Delivery.create({
      webhookId: webhook._id,
      eventId: event._id,
      ownerId: webhook.ownerId,
    });
    void processDelivery(delivery._id).catch((error) => {
      console.error(`Webhook delivery ${delivery._id} crashed:`, error.message);
    });
  }
}

module.exports = deliverEvent;
module.exports.buildDeliveryBody = buildDeliveryBody;
module.exports.canDeliverToWebhook = canDeliverToWebhook;
module.exports.deliverWebhookOnce = deliverWebhookOnce;
module.exports.processDelivery = processDelivery;
module.exports.signBody = signBody;
module.exports.readResponsePreview = readResponsePreview;
module.exports.REQUEST_TIMEOUT_MS = REQUEST_TIMEOUT_MS;
module.exports.RETRY_DELAYS_MS = RETRY_DELAYS_MS;
