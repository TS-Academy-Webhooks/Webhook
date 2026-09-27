const mongoose = require("mongoose");

const shipmentSchema = new mongoose.Schema(
  {
    trackingNumber: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      type: String,
      required: true,
    },
    origin: {
      type: String,
      required: true,
    },
    destination: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "created",
        "picked_up",
        "in_transit",
        "arrived_at_hub",
        "out_for_delivery",
        "delivered",
        "delivery_failed",
        "cancelled",
      ],
      default: "created",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Shipment", shipmentSchema);