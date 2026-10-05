const crypto = require("crypto");
const Delivery = require("../models/Delivery");
const DeliveryAttempt = require("../models/DeliveryAttempt");
const Event = require("../models/event");
const Webhook = require("../models/webhook");
const AppError = require("../utils/AppError");
const { paginatedData, sendSuccess } = require("../utils/apiResponse");
const validateWebhookUrl = require("../utils/validateWebhookUrl");
const { processDelivery } = require("../services/webhookDelivery");

function ownerFilter(req) {
  return req.user.role === "admin" ? {} : { ownerId: req.user._id };
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function serializeWebhook(webhook, revealSecret = false) {
  const result = webhook.toObject({ virtuals: true });
  result.id = String(result._id);
  result.user = result.ownerId;
  result.active = result.isActive;
  if (!revealSecret) {
    result.secret = result.secret
      ? `${result.secret.slice(0, 6)}****${result.secret.slice(-4)}`
      : null;
  }
  return result;
}

exports.createWebhook = async (req, res) => {
  const url = await validateWebhookUrl(req.body.url);
  const webhook = await Webhook.create({
    ownerId: req.user._id,
    name: req.body.name.trim(),
    url,
    events: req.body.events,
    isActive: req.body.isActive ?? req.body.active ?? true,
    secret: `whsec_${crypto.randomBytes(24).toString("hex")}`,
  });

  return sendSuccess(
    res,
    "Webhook created successfully",
    serializeWebhook(webhook, true),
    201
  );
};

exports.getWebhooks = async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const filter = ownerFilter(req);

  if (req.query.search) {
    const search = escapeRegExp(req.query.search);
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { url: { $regex: search, $options: "i" } },
    ];
  }
  const isActive = req.query.isActive ?? req.query.active;
  if (isActive !== undefined) {
    filter.isActive = isActive === true || isActive === "true";
  }
  if (req.query.event) {
    filter.events = { $in: [req.query.event, "*"] };
  }

  const [webhooks, total] = await Promise.all([
    Webhook.find(filter)
      .select("+secret")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Webhook.countDocuments(filter),
  ]);
  const items = webhooks.map((webhook) => serializeWebhook(webhook));

  return sendSuccess(
    res,
    "Webhooks retrieved successfully",
    paginatedData(items, page, limit, total, "webhooks")
  );
};

exports.getWebhook = async (req, res) => {
  const webhook = await Webhook.findOne({
    _id: req.params.id,
    ...ownerFilter(req),
  }).select("+secret");
  if (!webhook) {
    throw new AppError("Webhook not found", 404);
  }

  return sendSuccess(
    res,
    "Webhook retrieved successfully",
    serializeWebhook(webhook)
  );
};

exports.updateWebhook = async (req, res) => {
  const webhook = await Webhook.findOne({
    _id: req.params.id,
    ...ownerFilter(req),
  }).select("+secret");
  if (!webhook) {
    throw new AppError("Webhook not found", 404);
  }

  const { name, events, url, regenerateSecret } = req.body;
  const isActive = req.body.isActive ?? req.body.active;
  const hasUpdates = name !== undefined || events !== undefined || url !== undefined ||
    isActive !== undefined || regenerateSecret === true;
  if (!hasUpdates) {
    throw new AppError("Provide at least one supported field to update", 400);
  }

  if (name !== undefined) webhook.name = name.trim();
  if (events !== undefined) webhook.events = events;
  if (url !== undefined) webhook.url = await validateWebhookUrl(url);
  if (isActive !== undefined) webhook.isActive = isActive;
  if (regenerateSecret === true) {
    webhook.secret = `whsec_${crypto.randomBytes(24).toString("hex")}`;
  }
  await webhook.save();

  return sendSuccess(
    res,
    "Webhook updated successfully",
    serializeWebhook(webhook, regenerateSecret === true)
  );
};

exports.deleteWebhook = async (req, res) => {
  const webhook = await Webhook.findOneAndDelete({
    _id: req.params.id,
    ...ownerFilter(req),
  });
  if (!webhook) {
    throw new AppError("Webhook not found", 404);
  }

  return sendSuccess(res, "Webhook deleted successfully", {
    id: String(webhook._id),
    _id: webhook._id,
  });
};

exports.getWebhookDeliveries = async (req, res) => {
  const webhook = await Webhook.findOne({
    _id: req.params.id,
    ...ownerFilter(req),
  });
  if (!webhook) {
    throw new AppError("Webhook not found", 404);
  }

  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const filter = { webhookId: webhook._id, ...ownerFilter(req) };
  if (req.query.status) {
    filter.status = req.query.status;
  }
  const [deliveries, total] = await Promise.all([
    Delivery.find(filter)
      .populate("eventId", "eventId type")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Delivery.countDocuments(filter),
  ]);
  const items = await Promise.all(deliveries.map(async (delivery) => {
    const value = delivery.toObject({ virtuals: true });
    value.attempts = await DeliveryAttempt.find({ deliveryId: delivery._id })
      .populate("webhookId", "name url")
      .populate("eventId", "eventId type")
      .sort({ attemptNumber: 1 });
    return value;
  }));

  return sendSuccess(
    res,
    "Deliveries retrieved successfully",
    paginatedData(items, page, limit, total, "deliveries")
  );
};

exports.testWebhook = async (req, res) => {
  const webhook = await Webhook.findOne({
    _id: req.params.id,
    ...ownerFilter(req),
  });
  if (!webhook) {
    throw new AppError("Webhook not found", 404);
  }
  if (!webhook.isActive) {
    throw new AppError("Webhook is inactive", 400);
  }

  const event = await Event.create({
    eventId: `evt_${crypto.randomBytes(5).toString("hex")}`,
    type: "webhook.test",
    payload: {
      message: "This is a test event from your Logistics Webhook Platform",
    },
  });
  const delivery = await Delivery.create({
    webhookId: webhook._id,
    eventId: event._id,
    ownerId: webhook.ownerId,
  });

  void processDelivery(delivery._id).catch((error) => {
    console.error(`Test delivery ${delivery._id} crashed:`, error.message);
  });

  return sendSuccess(res, "Test event queued for delivery", delivery, 202);
};
