const mongoose = require("mongoose");

const eventTypes = [
  "shipment.created",
  "shipment.picked_up",
  "shipment.in_transit",
  "shipment.arrived_at_hub",
  "shipment.out_for_delivery",
  "shipment.delivered",
  "shipment.delivery_failed",
  "shipment.cancelled",
];

const eventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      match: /^evt_[a-zA-Z0-9]{6}$/,
    },
    type: {
      type: String,
      required: true,
      enum: eventTypes,
    },
    shipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipment",
      required: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);