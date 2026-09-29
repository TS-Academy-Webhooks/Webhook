const DeliveryAttempt = require("../models/DeliveryAttempt");
const Event = require("../models/event");
const Webhook = require("../models/webhook");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/apiResponse");
const { resendWebhookOnce } = require("../services/webhookDelivery");

exports.getDelivery = async (req, res) => {
  const delivery = await DeliveryAttempt.findById(req.params.id)
    .populate("webhookId", "name url")
    .populate("eventId", "eventId type payload");
  if (!delivery) {
    throw new AppError("Delivery attempt not found", 404);
  }

  return sendSuccess(res, "Delivery attempt retrieved successfully", delivery);
};

exports.resendDelivery = async (req, res) => {
  const previousAttempt = await DeliveryAttempt.findById(req.params.id);
  if (!previousAttempt) {
    throw new AppError("Delivery attempt not found", 404);
  }

  const [webhook, event] = await Promise.all([
    Webhook.findById(previousAttempt.webhookId).select("+secret"),
    Event.findById(previousAttempt.eventId),
  ]);
  if (!webhook) {
    throw new AppError("Webhook no longer exists", 404);
  }
  if (!event) {
    throw new AppError("Event not found", 404);
  }

  const attemptNumber = await DeliveryAttempt.countDocuments({
    webhookId: webhook._id,
    eventId: event._id,
  }) + 1;
  const attempt = await resendWebhookOnce(webhook, event, attemptNumber);
  return sendSuccess(res, "Webhook resent successfully", attempt);
};

exports.getDeliveries = async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const filter = {};
  if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.webhookId) {
    filter.webhookId = req.query.webhookId;
  }
  if (req.query.eventId) {
    filter.eventId = req.query.eventId;
  }
  const [deliveries, totalItems] = await Promise.all([
    DeliveryAttempt.find(filter)
      .populate("webhookId", "name url")
      .populate("eventId", "eventId type")
      .sort({ attemptedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    DeliveryAttempt.countDocuments(filter),
  ]);

  return sendSuccess(res, "Deliveries retrieved successfully", {
    deliveries,
    pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) },
  });
};