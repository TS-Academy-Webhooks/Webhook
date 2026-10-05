const mongoose = require("mongoose");
const Delivery = require("../models/Delivery");
const DeliveryAttempt = require("../models/DeliveryAttempt");
const Event = require("../models/event");
const Shipment = require("../models/Shipment");
const User = require("../models/User");
const Webhook = require("../models/webhook");

function hasField(document, field) {
  return Object.prototype.hasOwnProperty.call(document, field);
}

function isEmptyPatch({ set, unset }) {
  return Object.keys(set).length === 0 && Object.keys(unset).length === 0;
}

function normalizeLegacyUser(user) {
  const set = {};
  const unset = {};

  if (user.role !== "admin" && user.role !== "customer") {
    set.role = "customer";
  }
  if (!user.passwordHash && user.password) {
    set.passwordHash = user.password;
  }
  if (hasField(user, "password")) {
    unset.password = "";
  }

  return { set, unset };
}

function normalizeLegacyShipment(shipment, customerId) {
  const set = {};
  const unset = {};

  const history = Array.isArray(shipment.timeline) ? shipment.timeline : [];
  if (!Array.isArray(shipment.statusHistory) ||
      (shipment.statusHistory.length === 0 && history.length > 0)) {
    set.statusHistory = (history.length
      ? history
      : [{
        status: shipment.status || "created",
        at: shipment.updatedAt || shipment.createdAt || new Date(),
      }]
    ).map((entry) => ({
      status: entry.status || shipment.status || "created",
      timestamp: entry.timestamp || entry.at || shipment.createdAt || new Date(),
      ...(entry.note ? { note: entry.note } : {}),
    }));
  }
  if (customerId && !shipment.customerId) {
    set.customerId = customerId;
  }
  if (hasField(shipment, "timeline")) {
    unset.timeline = "";
  }

  return { set, unset };
}

function normalizeLegacyEvent(event) {
  const set = {};
  const unset = {};

  if (!event.shipmentId && event.shipment) {
    set.shipmentId = event.shipment;
  }
  if (hasField(event, "shipment")) {
    unset.shipment = "";
  }

  return { set, unset };
}

function normalizeLegacyWebhook(webhook, ownerId) {
  const set = {};
  const unset = {};
  const resolvedOwnerId = ownerId || webhook.ownerId || webhook.user;

  if (resolvedOwnerId && String(webhook.ownerId || "") !== String(resolvedOwnerId)) {
    set.ownerId = resolvedOwnerId;
  }
  if (typeof webhook.isActive !== "boolean") {
    set.isActive = webhook.active === undefined
      ? true
      : webhook.active === true || webhook.active === "true";
  }
  for (const field of ["user", "active"]) {
    if (hasField(webhook, field)) {
      unset[field] = "";
    }
  }

  return { set, unset };
}

function normalizeLegacyDelivery(delivery, ownerId) {
  const set = {};
  const unset = {};

  const eventId = delivery.eventId || delivery.event;
  const webhookId = delivery.webhookId || delivery.webhook;
  const resolvedOwnerId = ownerId || delivery.ownerId || delivery.user;
  if (eventId && !delivery.eventId) set.eventId = eventId;
  if (webhookId && !delivery.webhookId) set.webhookId = webhookId;
  if (resolvedOwnerId && !delivery.ownerId) set.ownerId = resolvedOwnerId;
  if (!["pending", "success", "failed"].includes(delivery.status)) {
    set.status = "pending";
  }
  if (!Number.isInteger(delivery.attemptCount) || delivery.attemptCount < 0) {
    set.attemptCount = 0;
  }
  if (!Number.isInteger(delivery.maxAttempts) || delivery.maxAttempts < 1) {
    set.maxAttempts = 3;
  }
  for (const field of ["event", "webhook", "user"]) {
    if (hasField(delivery, field)) {
      unset[field] = "";
    }
  }

  return { set, unset };
}

function normalizeLegacyAttempt(attempt, delivery) {
  const set = {};
  const unset = {};

  const deliveryId = attempt.deliveryId || attempt.delivery || delivery?._id;
  const webhookId = attempt.webhookId || delivery?.webhookId || delivery?.webhook;
  const eventId = attempt.eventId || delivery?.eventId || delivery?.event;
  if (deliveryId && !attempt.deliveryId) set.deliveryId = deliveryId;
  if (webhookId && !attempt.webhookId) set.webhookId = webhookId;
  if (eventId && !attempt.eventId) set.eventId = eventId;
  if (!Number.isInteger(attempt.attemptNumber) || attempt.attemptNumber < 1) {
    set.attemptNumber = 1;
  }
  if (attempt.httpStatus == null && attempt.statusCode !== undefined) {
    set.httpStatus = attempt.statusCode;
  }
  if (attempt.response == null && attempt.responseBody !== undefined) {
    set.response = attempt.responseBody;
  }
  if (attempt.duration == null && attempt.durationMs !== undefined) {
    set.duration = attempt.durationMs;
  }
  if (!["success", "failed"].includes(attempt.status)) {
    set.status = "failed";
  }
  for (const field of ["delivery", "statusCode", "responseBody", "durationMs"]) {
    if (hasField(attempt, field)) {
      unset[field] = "";
    }
  }

  return { set, unset };
}

function updateForPatch({ set, unset }) {
  const update = {};
  if (Object.keys(set).length) update.$set = set;
  if (Object.keys(unset).length) update.$unset = unset;
  return update;
}

async function applyPatch(collection, id, patch) {
  if (isEmptyPatch(patch)) return false;
  await collection.updateOne({ _id: id }, updateForPatch(patch));
  return true;
}

async function migrateLegacyUsers() {
  const users = await User.collection.find({
    $or: [
      { role: { $nin: ["admin", "customer"] } },
      { password: { $exists: true } },
    ],
  }).toArray();
  let migrated = 0;

  for (const user of users) {
    if (await applyPatch(User.collection, user._id, normalizeLegacyUser(user))) {
      migrated += 1;
    }
  }
  return migrated;
}

async function migrateLegacyShipments() {
  const shipments = await Shipment.collection.find({
    $or: [
      { statusHistory: { $exists: false } },
      { timeline: { $exists: true } },
    ],
  }).toArray();
  let migrated = 0;

  for (const shipment of shipments) {
    if (await applyPatch(
      Shipment.collection,
      shipment._id,
      normalizeLegacyShipment(shipment)
    )) {
      migrated += 1;
    }
  }

  const customerIds = await User.collection.distinct("_id", { role: "customer" });
  if (customerIds.length) {
    const result = await Shipment.collection.updateMany(
      {
        createdBy: { $in: customerIds },
        $or: [{ customerId: { $exists: false } }, { customerId: null }],
      },
      [{ $set: { customerId: "$createdBy" } }]
    );
    migrated += result.modifiedCount;
  }

  return migrated;
}

async function migrateLegacyEvents() {
  const events = await Event.collection.find({ shipment: { $exists: true } }).toArray();
  let migrated = 0;

  for (const event of events) {
    if (await applyPatch(Event.collection, event._id, normalizeLegacyEvent(event))) {
      migrated += 1;
    }
  }
  return migrated;
}

async function migrateLegacyWebhooks(adminId) {
  const webhooks = await Webhook.collection.find({
    $or: [
      { ownerId: { $exists: false } },
      { isActive: { $exists: false } },
      { user: { $exists: true } },
      { active: { $exists: true } },
    ],
  }).toArray();
  let migrated = 0;

  for (const webhook of webhooks) {
    const candidateOwnerId = webhook.ownerId || webhook.user;
    const ownerExists = candidateOwnerId
      ? await User.collection.findOne({ _id: candidateOwnerId }, { projection: { _id: 1 } })
      : null;
    const ownerId = ownerExists ? candidateOwnerId : adminId;
    if (await applyPatch(
      Webhook.collection,
      webhook._id,
      normalizeLegacyWebhook(webhook, ownerId)
    )) {
      migrated += 1;
    }
  }
  return migrated;
}

async function migrateLegacyDeliveries(adminId) {
  const summaries = await Delivery.collection.find({
    $or: [
      { eventId: { $exists: false } },
      { webhookId: { $exists: false } },
      { ownerId: { $exists: false } },
      { event: { $exists: true } },
      { webhook: { $exists: true } },
      { user: { $exists: true } },
    ],
  }).toArray();
  let migratedSummaries = 0;

  for (const delivery of summaries) {
    const eventId = delivery.eventId || delivery.event;
    const webhookId = delivery.webhookId || delivery.webhook;
    if (!eventId || !webhookId) {
      throw new Error(`Cannot migrate delivery ${delivery._id}: event or webhook reference is missing.`);
    }

    const webhook = await Webhook.collection.findOne({ _id: webhookId });
    const candidateOwnerId = delivery.ownerId || delivery.user || webhook?.ownerId || webhook?.user;
    const ownerExists = candidateOwnerId
      ? await User.collection.findOne({ _id: candidateOwnerId }, { projection: { _id: 1 } })
      : null;
    const patch = normalizeLegacyDelivery(
      delivery,
      ownerExists ? candidateOwnerId : adminId
    );
    if (await applyPatch(Delivery.collection, delivery._id, patch)) {
      migratedSummaries += 1;
    }
  }

  const legacyAttempts = await DeliveryAttempt.collection.find({
    $or: [
      { delivery: { $exists: true } },
      { statusCode: { $exists: true } },
      { responseBody: { $exists: true } },
      { durationMs: { $exists: true } },
    ],
  }).toArray();
  let migratedAttempts = 0;

  for (const attempt of legacyAttempts) {
    const deliveryId = attempt.deliveryId || attempt.delivery;
    const delivery = deliveryId
      ? await Delivery.collection.findOne({ _id: deliveryId })
      : null;
    if (await applyPatch(
      DeliveryAttempt.collection,
      attempt._id,
      normalizeLegacyAttempt(attempt, delivery)
    )) {
      migratedAttempts += 1;
    }
  }

  const standaloneAttempts = await DeliveryAttempt.collection.find({
    deliveryId: { $exists: false },
    delivery: { $exists: false },
    webhookId: { $exists: true },
    eventId: { $exists: true },
  }).sort({ attemptedAt: 1, createdAt: 1, _id: 1 }).toArray();
  const attemptGroups = new Map();
  for (const attempt of standaloneAttempts) {
    const key = `${attempt.webhookId}:${attempt.eventId}`;
    const group = attemptGroups.get(key) || [];
    group.push(attempt);
    attemptGroups.set(key, group);
  }

  let groupedAttempts = 0;
  for (const attempts of attemptGroups.values()) {
    const firstAttempt = attempts[0];
    let delivery = await Delivery.collection.findOne({
      webhookId: firstAttempt.webhookId,
      eventId: firstAttempt.eventId,
    });
    if (!delivery) {
      const webhook = await Webhook.collection.findOne({ _id: firstAttempt.webhookId });
      const candidateOwnerId = webhook?.ownerId || webhook?.user;
      const ownerExists = candidateOwnerId
        ? await User.collection.findOne({ _id: candidateOwnerId }, { projection: { _id: 1 } })
        : null;
      const created = await Delivery.create({
        webhookId: firstAttempt.webhookId,
        eventId: firstAttempt.eventId,
        ownerId: ownerExists ? candidateOwnerId : adminId,
        status: "failed",
        maxAttempts: 3,
      });
      delivery = created.toObject();
    }

    let attemptCount = Number(delivery.attemptCount) || 0;
    let lastAttemptAt = delivery.lastAttemptAt;
    let status = delivery.status;
    for (const attempt of attempts) {
      attemptCount = Math.max(attemptCount, Number(attempt.attemptNumber) || 1);
      lastAttemptAt = attempt.attemptedAt || attempt.createdAt || lastAttemptAt;
      status = attempt.status || status || "failed";
      await DeliveryAttempt.collection.updateOne(
        { _id: attempt._id },
        { $set: { deliveryId: delivery._id } }
      );
      groupedAttempts += 1;
    }

    await Delivery.collection.updateOne(
      { _id: delivery._id },
      {
        $set: {
          attemptCount,
          lastAttemptAt,
          status: ["pending", "success", "failed"].includes(status) ? status : "failed",
        },
      }
    );
  }

  return migratedSummaries + migratedAttempts + groupedAttempts;
}

async function migrateLegacyData(adminId, { skipUsers = false } = {}) {
  if (!mongoose.isValidObjectId(adminId)) {
    throw new Error("Cannot migrate legacy data without a valid bootstrap admin ID.");
  }

  const users = skipUsers ? 0 : await migrateLegacyUsers();
  const shipments = await migrateLegacyShipments();
  const events = await migrateLegacyEvents();
  const webhooks = await migrateLegacyWebhooks(adminId);
  const deliveries = await migrateLegacyDeliveries(adminId);
  return { users, shipments, events, webhooks, deliveries };
}

module.exports = migrateLegacyData;
module.exports.migrateLegacyUsers = migrateLegacyUsers;
module.exports.normalizeLegacyAttempt = normalizeLegacyAttempt;
module.exports.normalizeLegacyDelivery = normalizeLegacyDelivery;
module.exports.normalizeLegacyEvent = normalizeLegacyEvent;
module.exports.normalizeLegacyShipment = normalizeLegacyShipment;
module.exports.normalizeLegacyUser = normalizeLegacyUser;
module.exports.normalizeLegacyWebhook = normalizeLegacyWebhook;
