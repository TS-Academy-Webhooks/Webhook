const mongoose = require("mongoose");
const crypto = require("crypto");
const { SHIPMENT_EVENT_TYPES } = require("../utils/constants");

const webhookSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Webhook name is required"],
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    url: {
      type: String,
      required: [true, "Webhook URL is required"],
      trim: true,
    },
    secret: {
      type: String,
      default: () => `whsec_${crypto.randomBytes(24).toString("hex")}`,
      select: false, // never returned unless explicitly requested
    },
    events: {
      type: [String],
      required: true,
      validate: {
        validator: function (arr) {
          if (!Array.isArray(arr) || arr.length === 0) return false;
          return arr.every((e) => e === "*" || SHIPMENT_EVENT_TYPES.includes(e));
        },
        message: "events must contain valid shipment event types, or \"*\" for all",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

webhookSchema.index({ user: 1 });

webhookSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

// Does this webhook subscribe to the given event type?
webhookSchema.methods.subscribesTo = function (eventType) {
  return this.events.includes("*") || this.events.includes(eventType);
};

module.exports = mongoose.model("Webhook", webhookSchema);
