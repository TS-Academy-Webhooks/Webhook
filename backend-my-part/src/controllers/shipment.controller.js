const mongoose = require("mongoose");
const crypto = require("crypto");
const Shipment = require("../models/Shipment");
const AppError = require("../utils/app-error");
const catchAsync = require("../utils/catch-async");
const { SHIPMENT_STATUSES, isValidTransition } = require("../utils/constants");
const { createAndDispatchEvent } = require("../services/event.service");

async function generateTrackingNumber() {
  // Retry a few times in the extremely unlikely event of a collision.
  for (let i = 0; i < 5; i++) {
    const candidate = "TRK-" + crypto.randomInt(10000, 99999);
    const exists = await Shipment.exists({ trackingNumber: candidate });
    if (!exists) return candidate;
  }
  throw new Error("Could not generate a unique tracking number, try again");
}

// POST /api/shipments
exports.createShipment = catchAsync(async (req, res, next) => {
  const { customer, origin, destination, amount } = req.body;

  const errors = [];
  if (!customer || customer.trim().length < 2) {
    errors.push({ field: "customer", message: "Customer name is required" });
  }
  if (!origin || !origin.trim()) {
    errors.push({ field: "origin", message: "Origin is required" });
  }
  if (!destination || !destination.trim()) {
    errors.push({ field: "destination", message: "Destination is required" });
  }
  if (amount === undefined || isNaN(amount) || Number(amount) <= 0) {
    errors.push({ field: "amount", message: "Amount must be greater than 0" });
  }
  if (errors.length > 0) return next(new AppError("Validation failed", 400, errors));

  const trackingNumber = await generateTrackingNumber();

  const shipment = await Shipment.create({
    trackingNumber,
    customer: customer.trim(),
    origin: origin.trim(),
    destination: destination.trim(),
    amount: Number(amount),
    createdBy: req.user._id,
  });

  // The initial "created" status also fires shipment.created to subscribers.
  createAndDispatchEvent({
    type: "shipment.created",
    shipmentId: shipment._id,
    payload: {
      trackingNumber: shipment.trackingNumber,
      status: shipment.status,
      customer: shipment.customer,
      origin: shipment.origin,
      destination: shipment.destination,
    },
  }).catch((err) => console.error("Failed to dispatch shipment.created:", err.message));

  res.status(201).json({
    success: true,
    message: "Shipment created successfully",
    data: shipment,
  });
});

// GET /api/shipments
exports.getShipments = catchAsync(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  const { search, status } = req.query;

  const filter = {};
  if (search) {
    filter.$or = [
      { trackingNumber: { $regex: search, $options: "i" } },
      { customer: { $regex: search, $options: "i" } },
    ];
  }
  if (status) filter.status = status;

  const [items, total] = await Promise.all([
    Shipment.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Shipment.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: "Shipments retrieved successfully",
    data: {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    },
  });
});

// GET /api/shipments/:id
exports.getShipment = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid shipment ID", 400));
  }

  const shipment = await Shipment.findById(req.params.id);
  if (!shipment) return next(new AppError("Shipment not found", 404));

  res.status(200).json({
    success: true,
    message: "Shipment retrieved successfully",
    data: shipment,
  });
});

// PATCH /api/shipments/:id/status
exports.updateShipmentStatus = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid shipment ID", 400));
  }

  const { status, note } = req.body;

  if (!status || !SHIPMENT_STATUSES.includes(status)) {
    return next(
      new AppError("Validation failed", 400, [
        { field: "status", message: "Provide a valid shipment status" },
      ])
    );
  }

  const shipment = await Shipment.findById(req.params.id);
  if (!shipment) return next(new AppError("Shipment not found", 404));

  if (!isValidTransition(shipment.status, status)) {
    return next(
      new AppError(`Cannot move a shipment from "${shipment.status}" to "${status}"`, 400)
    );
  }

  shipment.status = status;
  shipment.timeline.push({ status, note });
  await shipment.save();

  createAndDispatchEvent({
    type: `shipment.${status}`,
    shipmentId: shipment._id,
    payload: {
      trackingNumber: shipment.trackingNumber,
      status: shipment.status,
      note: note || null,
    },
  }).catch((err) => console.error(`Failed to dispatch shipment.${status}:`, err.message));

  res.status(200).json({
    success: true,
    message: "Shipment status updated successfully",
    data: shipment,
  });
});
