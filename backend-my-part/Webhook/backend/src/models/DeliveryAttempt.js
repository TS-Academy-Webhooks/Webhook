const mongoose = require("mongoose");

const deliveryAttemptSchema = new mongoose.Schema(
  {
    webhookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Webhook",
      required: true,
    },
    eventId: {
      type: String,
      required: true,
    },
    attemptNumber: {
      type: Number,
      default: 1,
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
    },
    duration: {
      type: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DeliveryAttempt", deliveryAttemptSchema);