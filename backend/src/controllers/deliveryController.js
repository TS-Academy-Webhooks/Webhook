const Delivery = require("../models/Delivery");
const DeliveryAttempt = require("../models/DeliveryAttempt");
const Event = require("../models/event");
const Webhook = require("../models/webhook");
const AppError = require("../utils/AppError");
const { paginatedData, sendSuccess } = require("../utils/apiResponse");
const { processDelivery } = require("../services/webhookDelivery");

function ownerFilter(req) {
  return req.user.role === "admin" ? {} : { ownerId: req.user._id };
}

async function findDeliveryForUser(req, id) {
  const filter = ownerFilter(req);
  const delivery = await Delivery.findOne({ _id: id, ...filter });
  if (delivery) return { delivery };

  const attempt = await DeliveryAttempt.findById(id);
  if (!attempt) return null;

  if (attempt.deliveryId) {
    const parentDelivery = await Delivery.findOne({
      _id: attempt.deliveryId,
      ...filter,
    });
    return parentDelivery ? { delivery: parentDelivery, attempt } : null;
  }

  if (!attempt.webhookId) return null;
  const webhook = await Webhook.findOne({
    _id: attempt.webhookId,
    ...filter,
  });
  if (!webhook) return null;
  return { attempt };
}

async function getAttempts(deliveryId) {
  return DeliveryAttempt.find({ deliveryId })
    .sort({ attemptNumber: 1 })
    .populate("webhookId", "name url")
    .populate("eventId", "eventId type");
}

exports.getDelivery = async (req, res) => {
  const result = await findDeliveryForUser(req, req.params.id);
  if (!result) {
    throw new AppError("Delivery not found", 404);
  }

  if (!result.delivery) {
    const attempt = result.attempt.toObject({ virtuals: true });
    return sendSuccess(res, "Delivery attempt retrieved successfully", {
      ...attempt,
      delivery: null,
      attempts: [attempt],
    });
  }

  const delivery = await Delivery.findById(result.delivery._id)
    .populate("webhookId", "name url")
    .populate("eventId", "eventId type payload createdAt");
  const data = delivery.toObject({ virtuals: true });
  data.attempts = await getAttempts(delivery._id);
  return sendSuccess(res, "Delivery retrieved successfully", data);
};

exports.resendDelivery = async (req, res) => {
  const result = await findDeliveryForUser(req, req.params.id);
  if (!result) {
    throw new AppError("Delivery not found", 404);
  }

  let delivery = result.delivery;
  if (!delivery) {
    const sourceAttempt = result.attempt;
    const [webhook, event] = await Promise.all([
      Webhook.findOne({
        _id: sourceAttempt.webhookId,
        ...ownerFilter(req),
      }),
      Event.findById(sourceAttempt.eventId),
    ]);
    if (!webhook) {
      throw new AppError("Webhook no longer exists", 404);
    }
    if (!event) {
      throw new AppError("Event not found", 404);
    }

    const previousAttempts = await DeliveryAttempt.countDocuments({
      webhookId: webhook._id,
      eventId: event._id,
    });
    delivery = await Delivery.create({
      webhookId: webhook._id,
      eventId: event._id,
      ownerId: webhook.ownerId,
      status: "failed",
      attemptCount: previousAttempts,
      maxAttempts: previousAttempts + 1,
    });
  }

  if (delivery.status === "pending") {
    throw new AppError("Delivery is already in progress", 409);
  }
  if (delivery.status === "success") {
    delivery = await Delivery.create({
      webhookId: delivery.webhookId,
      eventId: delivery.eventId,
      ownerId: delivery.ownerId,
    });
  } else {
    delivery.maxAttempts = delivery.attemptCount + 1;
    delivery.status = "pending";
    await delivery.save();
  }

  void processDelivery(delivery._id).catch((error) => {
    console.error(`Resend of delivery ${delivery._id} crashed:`, error.message);
  });

  return sendSuccess(res, "Delivery queued for resend", delivery, 202);
};

exports.getDeliveries = async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const filter = ownerFilter(req);
  if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.webhookId) {
    filter.webhookId = req.query.webhookId;
  }
  if (req.query.eventId) {
    filter.eventId = req.query.eventId;
  }
  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
    if (filter.createdAt.$gte && filter.createdAt.$lte &&
        filter.createdAt.$gte > filter.createdAt.$lte) {
      throw new AppError("The from date must be earlier than the to date", 400);
    }
  }

  const [deliveries, total] = await Promise.all([
    Delivery.find(filter)
      .populate("webhookId", "name url")
      .populate("eventId", "eventId type")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Delivery.countDocuments(filter),
  ]);
  const items = deliveries.map((delivery) => delivery.toObject({ virtuals: true }));

  return sendSuccess(
    res,
    "Deliveries retrieved successfully",
    paginatedData(items, page, limit, total, "deliveries")
  );
};
