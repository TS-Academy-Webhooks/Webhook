const mongoose = require("mongoose");
const { Delivery, DeliveryAttempt } = require("../models/Delivery");
const AppError = require("../utils/app-error");
const catchAsync = require("../utils/catch-async");
const { retryDelivery } = require("../services/retry.service");

function ownerFilter(req) {
  return req.user.role === "admin" ? {} : { user: req.user._id };
}

// GET /api/deliveries
exports.getDeliveries = catchAsync(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  const { status, webhookId, eventId, from, to } = req.query;

  const filter = ownerFilter(req);
  if (status) filter.status = status;
  if (webhookId && mongoose.isValidObjectId(webhookId)) filter.webhook = webhookId;
  if (eventId && mongoose.isValidObjectId(eventId)) filter.event = eventId;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const [items, total] = await Promise.all([
    Delivery.find(filter)
      .populate("event", "eventId type")
      .populate("webhook", "name url")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Delivery.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: "Deliveries retrieved successfully",
    data: {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    },
  });
});

// GET /api/deliveries/:id
exports.getDelivery = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid delivery ID", 400));
  }

  const delivery = await Delivery.findOne({ _id: req.params.id, ...ownerFilter(req) })
    .populate("event", "eventId type payload createdAt")
    .populate("webhook", "name url");

  if (!delivery) return next(new AppError("Delivery not found", 404));

  const attempts = await DeliveryAttempt.find({ delivery: delivery._id }).sort({
    attemptNumber: 1,
  });

  res.status(200).json({
    success: true,
    message: "Delivery retrieved successfully",
    data: { ...delivery.toJSON(), attempts },
  });
});

// POST /api/deliveries/:id/resend  (also reachable as /retry, same behaviour)
exports.resendDelivery = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid delivery ID", 400));
  }

  const delivery = await Delivery.findOne({ _id: req.params.id, ...ownerFilter(req) });
  if (!delivery) return next(new AppError("Delivery not found", 404));

  try {
    const updated = await retryDelivery(delivery._id);
    res.status(202).json({
      success: true,
      message: "Delivery queued for resend",
      data: updated,
    });
  } catch (err) {
    return next(new AppError(err.message, 400));
  }
});
