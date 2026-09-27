const crypto = require("crypto");
const Webhook = require("../models/Webhook");
const DeliveryAttempt = require("../models/DeliveryAttempt");

async function deliverEvent(eventType, payload) {
  try {
    const webhooks = await Webhook.find({
      events: eventType,
      active: true,
    });

    for (const webhook of webhooks) {
      const body = JSON.stringify(payload);

      const signature = crypto
        .createHmac("sha256", webhook.secret)
        .update(body)
        .digest("hex");

      const startTime = Date.now();

      try {
        const response = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": signature,
          },
          body,
        });

        const duration = Date.now() - startTime;

        await DeliveryAttempt.create({
          webhookId: webhook._id,
          eventId: payload.eventId,
          status: response.ok ? "success" : "failed",
          httpStatus: response.status,
          response: response.statusText,
          duration,
        });

        console.log(
          `Webhook "${webhook.name}" delivered: ${response.status}`
        );
      } catch (err) {
        const duration = Date.now() - startTime;

        await DeliveryAttempt.create({
          webhookId: webhook._id,
          eventId: payload.eventId,
          status: "failed",
          response: err.message,
          duration,
        });

        console.log(`Webhook "${webhook.name}" failed: ${err.message}`);
      }
    }
  } catch (error) {
    console.log("Error finding webhooks:", error.message);
  }
}

module.exports = deliverEvent;