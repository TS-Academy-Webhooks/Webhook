const mongoose = require("mongoose");

const deliveryAttemptSchema = new mongoose.Schema(
  {
    webhookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Webhook",
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    attemptNumber: {
      type: Number,
      default: 1,
      min: 1,
    },
    status: {
      type: String,
      enum: ["success", "failed"],
      required: true,
    },
    httpStatus: {
      type: Number,
    },
    response: {
      type: String,
      maxlength: 1000,
    },
    duration: {
      type: Number,
      min: 0,
    },
    attemptedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

deliveryAttemptSchema.index({ webhookId: 1, eventId: 1 });

module.exports = mongoose.model("DeliveryAttempt", deliveryAttemptSchema);