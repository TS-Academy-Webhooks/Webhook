const Shipment = require("../models/Shipment");
const Event = require("../models/Event");
const deliverEvent = require("../services/webhookDelivery");

// Generate a random tracking number like TRK-48213
function generateTrackingNumber() {
  const number = Math.floor(10000 + Math.random() * 90000);
  return `TRK-${number}`;
}

// Create a new shipment
exports.createShipment = async (req, res) => {
  try {
    const { customer, origin, destination, amount } = req.body;

    if (!customer || !origin || !destination || !amount) {
      return res.status(400).json({
        success: false,
        message: "Please provide customer, origin, destination, and amount",
        data: null,
      });
    }

    const shipment = await Shipment.create({
      trackingNumber: generateTrackingNumber(),
      customer,
      origin,
      destination,
      amount,
    });

    res.status(201).json({
      success: true,
      message: "Shipment created successfully",
      data: shipment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong creating the shipment",
      data: null,
    });
  }
};

// Get all shipments
exports.getShipments = async (req, res) => {
  try {
    const shipments = await Shipment.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      message: "Shipments retrieved successfully",
      data: shipments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong retrieving shipments",
      data: null,
    });
  }
};

// Track a shipment publicly by tracking number
exports.trackShipment = async (req, res) => {
  try {
    const { trackingNumber } = req.params;

    const shipment = await Shipment.findOne({ trackingNumber });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
        data: null,
      });
    }

    res.json({
      success: true,
      message: "Shipment found",
      data: {
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
        origin: shipment.origin,
        destination: shipment.destination,
        lastUpdate: shipment.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong retrieving the shipment",
      data: null,
    });
  }
};

// Update a shipment's status
exports.updateShipmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "created",
      "picked_up",
      "in_transit",
      "arrived_at_hub",
      "out_for_delivery",
      "delivered",
      "delivery_failed",
      "cancelled",
    ];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid status",
        data: null,
      });
    }

    const shipment = await Shipment.findById(id);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
        data: null,
      });
    }

    shipment.status = status;
    await shipment.save();

    // Generate an event for this status change
    const eventId = "evt_" + Math.floor(100000 + Math.random() * 900000);
    const eventType = "shipment." + status;

    await Event.create({
      eventId,
      type: eventType,
      shipmentId: shipment._id,
      payload: {
        event: eventType,
        eventId,
        shipmentId: shipment.trackingNumber,
        status: shipment.status,
        timestamp: new Date(),
      },
    });

    deliverEvent(eventType, {
  event: eventType,
  eventId,
  shipmentId: shipment.trackingNumber,
  status: shipment.status,
  timestamp: new Date(),
});

    res.json({
      success: true,
      message: "Shipment status updated successfully",
      data: shipment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong updating the shipment",
      data: null,
    });
  }
};

// Get all events
exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      message: "Events retrieved successfully",
      data: events,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong retrieving events",
      data: null,
    });
  }
};