const mongoose = require("mongoose");

const webhookEventTypes = [
  "shipment.created",
  "shipment.picked_up",
  "shipment.in_transit",
  "shipment.arrived_at_hub",
  "shipment.out_for_delivery",
  "shipment.delivered",
  "shipment.delivery_failed",
  "shipment.cancelled",
];

const webhookSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    events: {
      type: [{ type: String, enum: webhookEventTypes }],
      required: true,
      validate: {
        validator: (events) => events.length > 0,
        message: "At least one event subscription is required",
      },
    },
    secret: {
      type: String,
      required: true,
      // Queries must opt in before retrieving a signing secret.
      select: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Webhook", webhookSchema);