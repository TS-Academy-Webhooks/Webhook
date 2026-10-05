const mongoose = require("mongoose");

const eventTypes = [
  "webhook.test",
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
      match: /^evt_[a-zA-Z0-9]{6,32}$/,
    },
    type: {
      type: String,
      required: true,
      enum: eventTypes,
    },
    shipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipment",
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true }
);

eventSchema.virtual("shipment").get(function getShipment() {
  return this.shipmentId;
});

eventSchema.set("toJSON", {
  virtuals: true,
  transform(_document, result) {
    result.id = String(result._id);
    delete result.__v;
    return result;
  },
});

module.exports = mongoose.model("Event", eventSchema);