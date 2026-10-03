const mongoose = require("mongoose");
const { SHIPMENT_STATUSES } = require("../utils/constants");

// One entry per status change, so the tracking page can show a full history.
const timelineEntrySchema = new mongoose.Schema(
  {
    status: { type: String, enum: SHIPMENT_STATUSES, required: true },
    note: { type: String, trim: true, maxlength: 200 },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const shipmentSchema = new mongoose.Schema(
  {
    trackingNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    customer: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    origin: {
      type: String,
      required: [true, "Origin is required"],
      trim: true,
      maxlength: 120,
    },
    destination: {
      type: String,
      required: [true, "Destination is required"],
      trim: true,
      maxlength: 120,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount must be greater than or equal to 0"],
    },
    status: {
      type: String,
      enum: SHIPMENT_STATUSES,
      default: "created",
    },
    timeline: {
      type: [timelineEntrySchema],
      default: () => [{ status: "created" }],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

shipmentSchema.index({ customer: 1 });

shipmentSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Shipment", shipmentSchema);
