const { randomInt } = require("crypto");
const Event = require("../models/event");
const Webhook = require("../models/webhook");

async function createShipmentEvent(shipment) {
  const type = `shipment.${shipment.status}`;
  const timestamp = new Date();
  const eventId = `evt_${randomInt(100000, 1000000)}`;
  const payload = {
    event: type,
    eventId,
    shipmentId: shipment.trackingNumber,
    status: shipment.status,
    timestamp: timestamp.toISOString(),
  };

  const event = await Event.create({
    eventId,
    type,
    shipmentId: shipment._id,
    payload,
  });
  const webhooks = await Webhook.find({ events: type, active: true }).select("name");

  for (const webhook of webhooks) {
    console.log(`Webhook "${webhook.name}" would receive ${event.type} (${event.eventId})`);
  }

  return event;
}

module.exports = { createShipmentEvent };
