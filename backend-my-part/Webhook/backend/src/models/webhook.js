const mongoose = require("mongoose");

const webhookSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    events: {
      type: [String],
      required: true,
    },
    secret: {
      type: String,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Webhook", webhookSchema);