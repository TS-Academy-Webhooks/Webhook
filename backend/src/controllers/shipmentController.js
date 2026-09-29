const Shipment = require("../models/Shipment");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/apiResponse");
const {
  changeShipmentStatus,
  createShipment,
} = require("../services/shipmentService");
const { createShipmentEvent } = require("../services/eventService");

exports.createShipment = async (req, res) => {
  const shipment = await createShipment(req.body);
  await createShipmentEvent(shipment);
  return sendSuccess(res, "Shipment created successfully", shipment, 201);
};

exports.getShipments = async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const filter = {};

  if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.search) {
    const search = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { trackingNumber: { $regex: search, $options: "i" } },
      { customer: { $regex: search, $options: "i" } },
      { origin: { $regex: search, $options: "i" } },
      { destination: { $regex: search, $options: "i" } },
    ];
  }

  const [shipments, totalItems] = await Promise.all([
    Shipment.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Shipment.countDocuments(filter),
  ]);

  return sendSuccess(res, "Shipments retrieved successfully", {
    shipments,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  });
};

exports.getShipment = async (req, res) => {
  const shipment = await Shipment.findById(req.params.id);
  if (!shipment) {
    throw new AppError("Shipment not found", 404);
  }

  return sendSuccess(res, "Shipment retrieved successfully", shipment);
};

exports.updateShipmentStatus = async (req, res) => {
  const shipment = await changeShipmentStatus(req.params.id, req.body.status);
  await createShipmentEvent(shipment);
  return sendSuccess(res, "Shipment status updated successfully", shipment);
};