const crypto = require("crypto");
const Webhook = require("../models/Webhook");
const DeliveryAttempt = require("../models/DeliveryAttempt");

// Create a new webhook
exports.createWebhook = async (req, res) => {
  try {
    const { name, url, events } = req.body;

    if (!name || !url || !events || events.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, url, and at least one event",
        data: null,
      });
    }

    const secret = crypto.randomBytes(32).toString("hex");

    const webhook = await Webhook.create({
      name,
      url,
      events,
      secret,
      ownerId: "000000000000000000000000",
    });

    res.status(201).json({
      success: true,
      message: "Webhook created successfully",
      data: webhook,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong creating the webhook",
      data: null,
    });
  }
};

// Get all webhooks
exports.getWebhooks = async (req, res) => {
  try {
    const webhooks = await Webhook.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      message: "Webhooks retrieved successfully",
      data: webhooks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong retrieving webhooks",
      data: null,
    });
  }
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