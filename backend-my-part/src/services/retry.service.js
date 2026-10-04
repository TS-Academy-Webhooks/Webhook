const { Delivery } = require("../models/Delivery");
const Webhook = require("../models/Webhook");
const Event = require("../models/Event");
const { makeOneAttempt } = require("./delivery.service");

const RETRY_DELAYS_MS = [10_000, 30_000]; // wait before attempt 2, then before attempt 3

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Runs a delivery through up to maxAttempts, waiting between retries.
// This does NOT block the API response — call it without awaiting
// from the controller/event service (see event.service.js).
async function processDelivery(deliveryId) {
  const delivery = await Delivery.findById(deliveryId);
  if (!delivery) return;

  const webhook = await Webhook.findById(delivery.webhook).select("+secret");
  const event = await Event.findById(delivery.event);

  if (!webhook || !event) {
    delivery.status = "failed";
    await delivery.save();
    return;
  }

  while (delivery.attemptCount < delivery.maxAttempts) {
    const attemptNumber = delivery.attemptCount + 1;
    const succeeded = await makeOneAttempt(delivery, webhook, event, attemptNumber);

    delivery.attemptCount = attemptNumber;
    delivery.lastAttemptAt = new Date();

    if (succeeded) {
      delivery.status = "success";
      await delivery.save();
      return;
    }

    // more attempts left? wait before the next one
    if (delivery.attemptCount < delivery.maxAttempts) {
      delivery.status = "pending";
      await delivery.save();
      await sleep(RETRY_DELAYS_MS[delivery.attemptCount - 1] || 30_000);
    }
  }

  delivery.status = "failed";
  await delivery.save();
}

// Manually retry a delivery that has status "failed".
// Continues the attempt count rather than resetting it, and gives it
// one additional attempt beyond wherever it stopped.
async function retryDelivery(deliveryId) {
  const delivery = await Delivery.findById(deliveryId);
  if (!delivery) throw new Error("Delivery not found");
  if (delivery.status !== "failed") {
    throw new Error("Only failed deliveries can be retried");
  }

  delivery.maxAttempts = delivery.attemptCount + 1;
  delivery.status = "pending";
  await delivery.save();

  processDelivery(delivery._id).catch((err) => {
    console.error(`Retry of delivery ${delivery._id} crashed unexpectedly:`, err.message);
  });

  return delivery;
}

module.exports = { processDelivery, retryDelivery };
