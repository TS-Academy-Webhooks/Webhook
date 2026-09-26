const Shipment = require("../models/Shipment");
const AppError = require("../utils/app-error");
const catchAsync = require("../utils/catch-async");

// GET /api/tracking/:trackingNumber  (public, no auth)
exports.trackShipment = catchAsync(async (req, res, next) => {
  const trackingNumber = (req.params.trackingNumber || "").trim().toUpperCase();

  if (!/^TRK-\d{5}$/.test(trackingNumber)) {
    return next(new AppError("Invalid tracking number format", 400));
  }

  const shipment = await Shipment.findOne({ trackingNumber });
  if (!shipment) {
    return next(new AppError("Shipment not found", 404));
  }

  // Only expose what a customer needs — never internal fields like
  // amount, createdBy, or database IDs.
  res.status(200).json({
    success: true,
    message: "Shipment found",
    data: {
      trackingNumber: shipment.trackingNumber,
      status: shipment.status,
      origin: shipment.origin,
      destination: shipment.destination,
      lastUpdate: shipment.updatedAt,
      timeline: shipment.timeline.map((t) => ({ status: t.status, at: t.at })),
    },
  });
});
