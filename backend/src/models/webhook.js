const crypto = require("crypto");
const mongoose = require("mongoose");

const webhookEventTypes = [
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

const webhookSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    events: {
      type: [String],
      required: true,
      validate: {
        validator: (events) => Array.isArray(events) && events.length > 0 &&
          events.every((event) => event === "*" || webhookEventTypes.includes(event)),
        message: 'Events must contain valid shipment event types, or "*" for all',
      },
    },
    secret: {
      type: String,
      required: true,
      default: () => `whsec_${crypto.randomBytes(24).toString("hex")}`,
      // Queries must opt in before retrieving a signing secret.
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

webhookSchema.index({ ownerId: 1, createdAt: -1 });
webhookSchema.virtual("user").get(function getUser() {
  return this.ownerId;
});
webhookSchema.virtual("active").get(function getActive() {
  return this.isActive;
});
webhookSchema.set("toJSON", {
  virtuals: true,
  transform(_document, result) {
    result.id = String(result._id);
    delete result.__v;
    return result;
  },
});

module.exports = mongoose.model("Webhook", webhookSchema);