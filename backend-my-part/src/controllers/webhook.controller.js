const mongoose = require("mongoose");
const Webhook = require("../models/Webhook");
const { Delivery } = require("../models/Delivery");
const Event = require("../models/Event");
const AppError = require("../utils/app-error");
const catchAsync = require("../utils/catch-async");
const { SHIPMENT_EVENT_TYPES } = require("../utils/constants");
const { generateSecret, maskSecret } = require("../services/webhook.service");
const { processDelivery } = require("../services/retry.service");

// A simple, lightweight URL check: must be a valid URL and use https://.
// (In development, http://localhost is allowed for local testing.)
// This is intentionally basic for the scope of this project. it does not check for private/internal IP addresses.
function isAcceptableUrl(url) {
  try {
    const parsed = new URL(url);
    if (process.env.NODE_ENV !== "production" && parsed.hostname === "localhost") {
      return true;
    }
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function validateWebhookInput({ name, url, events }, { partial = false } = {}) {
  const errors = [];

  if (!partial || name !== undefined) {
    if (!name || name.trim().length < 2 || name.trim().length > 80) {
      errors.push({ field: "name", message: "Name must be 2 to 80 characters" });
    }
  }

  if (!partial || url !== undefined) {
    if (!url || !isAcceptableUrl(url)) {
      errors.push({ field: "url", message: "URL must be a valid https:// address" });
    }
  }

  if (!partial || events !== undefined) {
    if (!Array.isArray(events) || events.length === 0) {
      errors.push({ field: "events", message: "Select at least one event" });
    } else if (!events.every((e) => e === "*" || SHIPMENT_EVENT_TYPES.includes(e))) {
      errors.push({ field: "events", message: "One or more event types are not valid" });
    }
  }

  return errors;
}

function ownerFilter(req) {
  return req.user.role === "admin" ? {} : { user: req.user._id };
}

// POST /api/webhooks
exports.createWebhook = catchAsync(async (req, res, next) => {
  const { name, url, events, isActive } = req.body;

  const errors = validateWebhookInput({ name, url, events });
  if (errors.length > 0) return next(new AppError("Validation failed", 400, errors));

  const webhook = await Webhook.create({
    user: req.user._id,
    name: name.trim(),
    url: url.trim(),
    events,
    isActive: isActive !== undefined ? Boolean(isActive) : true,
  });

  const full = await Webhook.findById(webhook._id).select("+secret");

  res.status(201).json({
    success: true,
    message: "Webhook created successfully",
    data: full,
  });
});

// GET /api/webhooks
exports.getWebhooks = catchAsync(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  const { search, isActive, event } = req.query;

  const filter = ownerFilter(req);
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { url: { $regex: search, $options: "i" } },
    ];
  }
  if (isActive !== undefined) filter.isActive = isActive === "true";
  if (event) filter.events = { $in: [event, "*"] };

  const [items, total] = await Promise.all([
    Webhook.find(filter)
      .select("+secret")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Webhook.countDocuments(filter),
  ]);

  const masked = items.map((w) => {
    const obj = w.toJSON();
    obj.secret = maskSecret(w._doc.secret);
    return obj;
  });

  res.status(200).json({
    success: true,
    message: "Webhooks retrieved successfully",
    data: {
      items: masked,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    },
  });
});

// GET /api/webhooks/:id
exports.getWebhook = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid webhook ID", 400));
  }

  const webhook = await Webhook.findOne({ _id: req.params.id, ...ownerFilter(req) }).select(
    "+secret"
  );
  if (!webhook) return next(new AppError("Webhook not found", 404));

  // The secret is only ever shown in full at the moment it's created or regenerated (see createWebhook and updateWebhook). Every other time it's viewed, it's masked, this is the same pattern GitHub uses for
  // personal access tokens: you can regenerate if you lose it, but you can never just look it up again casually.
  const obj = webhook.toJSON();
  obj.secret = maskSecret(webhook._doc.secret);

  res.status(200).json({
    success: true,
    message: "Webhook retrieved successfully",
    data: obj,
  });
});

// PUT /api/webhooks/:id
exports.updateWebhook = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid webhook ID", 400));
  }

  const webhook = await Webhook.findOne({ _id: req.params.id, ...ownerFilter(req) }).select(
    "+secret"
  );
  if (!webhook) return next(new AppError("Webhook not found", 404));

  const { name, url, events, isActive, regenerateSecret } = req.body;

  const errors = validateWebhookInput({ name, url, events }, { partial: true });
  if (errors.length > 0) return next(new AppError("Validation failed", 400, errors));

  if (url !== undefined) webhook.url = url.trim();
  if (name !== undefined) webhook.name = name.trim();
  if (events !== undefined) webhook.events = events;
  if (isActive !== undefined) webhook.isActive = Boolean(isActive);

  const didRegenerateSecret = Boolean(regenerateSecret);
  if (didRegenerateSecret) webhook.secret = generateSecret();

  await webhook.save();

  // Only show the full secret when this request just generated a NEW one
  // (the user needs to copy it right now). Otherwise, mask it — same rule as every other GET/view of a webhook.
  const obj = webhook.toJSON();
  obj.secret = didRegenerateSecret ? webhook._doc.secret : maskSecret(webhook._doc.secret);

  res.status(200).json({
    success: true,
    message: "Webhook updated successfully",
    data: obj,
  });
});

// DELETE /api/webhooks/:id
exports.deleteWebhook = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid webhook ID", 400));
  }

  const webhook = await Webhook.findOneAndDelete({ _id: req.params.id, ...ownerFilter(req) });
  if (!webhook) return next(new AppError("Webhook not found", 404));

  res.status(200).json({
    success: true,
    message: "Webhook deleted successfully",
    data: null,
  });
});

// GET /api/webhooks/:id/deliveries
exports.getWebhookDeliveries = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid webhook ID", 400));
  }

  const webhook = await Webhook.findOne({ _id: req.params.id, ...ownerFilter(req) });
  if (!webhook) return next(new AppError("Webhook not found", 404));

  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);

  const filter = { webhook: webhook._id };
  if (req.query.status) filter.status = req.query.status;

  const [items, total] = await Promise.all([
    Delivery.find(filter)
      .populate("event", "eventId type")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Delivery.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: "Deliveries retrieved successfully",
    data: {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    },
  });
});

// POST /api/webhooks/:id/test
// This targets ONE specific webhook directly, regardless of which events
// it's subscribed to, so it bypasses the normal "find matching webhooks" path used for real shipment events.
exports.testWebhook = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid webhook ID", 400));
  }

  const webhook = await Webhook.findOne({ _id: req.params.id, ...ownerFilter(req) });
  if (!webhook) return next(new AppError("Webhook not found", 404));
  if (!webhook.isActive) return next(new AppError("Webhook is inactive", 400));

  const event = await Event.create({
    type: "webhook.test",
    shipment: new mongoose.Types.ObjectId(), // placeholder; test events aren't tied to a real shipment
    payload: { message: "This is a test event from your Logistics Webhook Platform" },
  });

  const delivery = await Delivery.create({
    event: event._id,
    webhook: webhook._id,
    user: webhook.user,
  });

  processDelivery(delivery._id).catch((err) =>
    console.error(`Test delivery ${delivery._id} crashed:`, err.message)
  );

  res.status(202).json({
    success: true,
    message: "Test event queued for delivery",
    data: delivery,
  });
});
