const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      required: true,
    },
    shipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipment",
      required: true,
    },
    payload: {
      type: Object,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);