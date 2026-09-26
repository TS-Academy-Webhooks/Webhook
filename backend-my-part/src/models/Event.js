const mongoose = require("mongoose");
const crypto = require("crypto");

const eventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      default: () => `evt_${crypto.randomBytes(8).toString("hex")}`,
      unique: true,
    },
    type: {
      type: String,
      required: true, // validated against SHIPMENT_EVENT_TYPES in the controller/service
    },
    shipment: {
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

eventSchema.index({ shipment: 1 });
eventSchema.index({ type: 1 });

eventSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Event", eventSchema);
