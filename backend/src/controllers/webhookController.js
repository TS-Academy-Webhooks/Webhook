const crypto = require("crypto");
const Webhook = require("../models/webhook");
const DeliveryAttempt = require("../models/DeliveryAttempt");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/apiResponse");
const validateWebhookUrl = require("../utils/validateWebhookUrl");

exports.createWebhook = async (req, res) => {
  const url = await validateWebhookUrl(req.body.url);
  const secret = `whsec_${crypto.randomBytes(16).toString("hex")}`;
  const webhook = await Webhook.create({
    name: req.body.name,
    url,
    events: req.body.events,
    secret,
  });

  return sendSuccess(res, "Webhook created successfully", {
    ...webhook.toObject(),
    secret,
  }, 201);
};

exports.getWebhooks = async (req, res) => {
  const webhooks = await Webhook.find().sort({ createdAt: -1 });
  return sendSuccess(res, "Webhooks retrieved successfully", webhooks);
};

exports.getWebhook = async (req, res) => {
  const webhook = await Webhook.findById(req.params.id);
  if (!webhook) {
    throw new AppError("Webhook not found", 404);
  }

  return sendSuccess(res, "Webhook retrieved successfully", webhook);
};

exports.updateWebhook = async (req, res) => {
  const updates = {};
  for (const field of ["name", "events", "active"]) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }
  if (req.body.url !== undefined) {
    updates.url = await validateWebhookUrl(req.body.url);
  }
  if (!Object.keys(updates).length) {
    throw new AppError("Provide at least one supported field to update", 400);
  }

  const webhook = await Webhook.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!webhook) {
    throw new AppError("Webhook not found", 404);
  }

  return sendSuccess(res, "Webhook updated successfully", webhook);
};

exports.deleteWebhook = async (req, res) => {
  const webhook = await Webhook.findByIdAndDelete(req.params.id);
  if (!webhook) {
    throw new AppError("Webhook not found", 404);
  }

  return sendSuccess(res, "Webhook deleted successfully", { id: webhook._id });
};

// Get delivery logs for a specific webhook
exports.getWebhookDeliveries = async (req, res) => {
  try {
    const { id } = req.params;
    const deliveries = await DeliveryAttempt.find({ webhookId: id }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      message: "Delivery logs retrieved successfully",
      data: deliveries,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong retrieving delivery logs",
      data: null,
    });
  }
};