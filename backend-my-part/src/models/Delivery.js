const mongoose = require("mongoose");

const deliverySchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    webhook: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Webhook",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // copied from webhook.user so lists can filter by owner easily
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    attemptCount: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    lastAttemptAt: { type: Date },
  },
  { timestamps: true }
);

deliverySchema.index({ user: 1, status: 1 });
deliverySchema.index({ webhook: 1 });
deliverySchema.index({ event: 1 });

deliverySchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const deliveryAttemptSchema = new mongoose.Schema(
  {
    delivery: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Delivery",
      required: true,
    },
    attemptNumber: { type: Number, required: true },
    status: { type: String, enum: ["success", "failed"], required: true },
    statusCode: { type: Number, default: null },
    responseBody: { type: String, default: null, maxlength: 1000 },
    errorMessage: { type: String, default: null },
    durationMs: { type: Number, default: null },
  },
  { timestamps: true }
);

deliveryAttemptSchema.index({ delivery: 1 });

deliveryAttemptSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Delivery = mongoose.model("Delivery", deliverySchema);
const DeliveryAttempt = mongoose.model("DeliveryAttempt", deliveryAttemptSchema);

module.exports = { Delivery, DeliveryAttempt };
