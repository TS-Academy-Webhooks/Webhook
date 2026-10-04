const mongoose = require("mongoose");
const Event = require("../models/Event");
const { Delivery } = require("../models/Delivery");
const AppError = require("../utils/app-error");
const catchAsync = require("../utils/catch-async");

// GET /api/events
exports.getEvents = catchAsync(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);

  const filter = {};
  if (req.query.type) filter.type = req.query.type;
  if (req.query.shipmentId && mongoose.isValidObjectId(req.query.shipmentId)) {
    filter.shipment = req.query.shipmentId;
  }

  const [items, total] = await Promise.all([
    Event.find(filter)
      .populate("shipment", "trackingNumber")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Event.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: "Events retrieved successfully",
    data: {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    },
  });
});

// GET /api/events/:id
exports.getEvent = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid event ID", 400));
  }

  const event = await Event.findById(req.params.id).populate("shipment", "trackingNumber");
  if (!event) return next(new AppError("Event not found", 404));

  const deliveries = await Delivery.find({ event: event._id }).populate("webhook", "name url");

  res.status(200).json({
    success: true,
    message: "Event retrieved successfully",
    data: { event, deliveries },
  });
});
