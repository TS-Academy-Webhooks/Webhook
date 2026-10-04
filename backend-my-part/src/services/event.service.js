const Event = require("../models/Event");
const { Delivery } = require("../models/Delivery");
const { findMatchingWebhooks } = require("./webhook.service");
const { processDelivery } = require("./retry.service");

// Call this whenever something happens that webhooks might care about
// (right now: a shipment status change). It saves the Event, finds every
// active webhook subscribed to it, creates one Delivery per webhook, and
// starts sending each in the background (it does NOT wait for delivery
// to finish — the caller gets a fast response).
async function createAndDispatchEvent({ type, shipmentId, payload }) {
  const event = await Event.create({ type, shipment: shipmentId, payload });

  const webhooks = await findMatchingWebhooks(type);
  const deliveries = [];

  for (const webhook of webhooks) {
    const delivery = await Delivery.create({
      event: event._id,
      webhook: webhook._id,
      user: webhook.user,
    });
    deliveries.push(delivery);

    processDelivery(delivery._id).catch((err) => {
      console.error(`Delivery ${delivery._id} crashed unexpectedly:`, err.message);
    });
  }

  return { event, deliveries };
}

module.exports = { createAndDispatchEvent };
