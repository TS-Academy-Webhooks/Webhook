const assert = require("node:assert/strict");
const { test } = require("node:test");
const mongoose = require("mongoose");
const User = require("../src/models/User");
const Shipment = require("../src/models/Shipment");
const Webhook = require("../src/models/webhook");
const Event = require("../src/models/event");
const DeliveryAttempt = require("../src/models/DeliveryAttempt");
const app = require("../src/app");
const validateWebhookUrl = require("../src/utils/validateWebhookUrl");
const { ALLOWED_STATUS_TRANSITIONS } = require("../src/services/shipmentService");

test("models validate required formats, defaults, and references", async () => {
  assert.equal(User.schema.path("role"), undefined);
  assert.equal(User.schema.path("passwordHash").options.select, false);
  assert.equal(Webhook.schema.path("ownerId"), undefined);
  assert.equal(Webhook.schema.path("secret").options.select, false);

  const shipment = new Shipment({
    trackingNumber: "TRK-12345",
    customer: "Test",
    origin: "A",
    destination: "B",
    amount: 0,
  });
  await shipment.validate();
  assert.equal(shipment.statusHistory[0].status, "created");
  assert.ok(shipment.statusHistory[0].timestamp instanceof Date);
  await assert.rejects(new Shipment({
    trackingNumber: "TRK-12346",
    customer: "Test",
    origin: "A",
    destination: "B",
    amount: -1,
  }).validate(), mongoose.Error.ValidationError);

  const objectId = new mongoose.Types.ObjectId();
  await new Event({
    eventId: "evt_123456",
    type: "shipment.created",
    shipmentId: objectId,
    payload: { event: "shipment.created" },
  }).validate();
  assert.equal(DeliveryAttempt.schema.path("eventId").options.ref, "Event");
  assert.ok(DeliveryAttempt.schema.indexes().some(([keys]) => keys.webhookId === 1 && keys.eventId === 1));
});

test("shipment transition map matches the allowed workflow", () => {
  assert.deepEqual(ALLOWED_STATUS_TRANSITIONS, {
    created: ["picked_up", "cancelled"],
    picked_up: ["in_transit", "cancelled"],
    in_transit: ["arrived_at_hub", "cancelled"],
    arrived_at_hub: ["in_transit", "out_for_delivery", "cancelled"],
    out_for_delivery: ["delivered", "delivery_failed"],
    delivery_failed: ["out_for_delivery", "cancelled"],
    delivered: [],
    cancelled: [],
  });
});

test("webhook URL policy gates localhost and blocks production loopback", async () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalLocalFlag = process.env.ALLOW_LOCALHOST_WEBHOOKS;

  try {
    process.env.NODE_ENV = "development";
    process.env.ALLOW_LOCALHOST_WEBHOOKS = "false";
    await assert.rejects(validateWebhookUrl("http://localhost:3000"), { statusCode: 400 });
    process.env.ALLOW_LOCALHOST_WEBHOOKS = "true";
    assert.equal(await validateWebhookUrl("http://localhost:3000/receiver"), "http://localhost:3000/receiver");

    process.env.NODE_ENV = "production";
    await assert.rejects(validateWebhookUrl("http://127.0.0.1:3000"), { statusCode: 400 });
    assert.equal(await validateWebhookUrl("https://8.8.8.8"), "https://8.8.8.8/");
  } finally {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    if (originalLocalFlag === undefined) delete process.env.ALLOW_LOCALHOST_WEBHOOKS;
    else process.env.ALLOW_LOCALHOST_WEBHOOKS = originalLocalFlag;
  }
});

test("public and protected routes use the standard response envelope", async (t) => {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => {
    server.closeAllConnections();
    server.close();
  });

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const healthResponse = await fetch(`${baseUrl}/health`);
  const health = await healthResponse.json();
  assert.equal(healthResponse.status, 200);
  assert.equal(health.success, true);
  assert.ok(healthResponse.headers.has("x-content-type-options"));

  const protectedResponse = await fetch(`${baseUrl}/api/shipments`);
  const protectedBody = await protectedResponse.json();
  assert.equal(protectedResponse.status, 401);
  assert.equal(protectedBody.success, false);
  assert.equal(protectedBody.data, null);

  const trackingResponse = await fetch(`${baseUrl}/api/tracking/invalid`);
  assert.equal(trackingResponse.status, 400);

  const failureResponse = await fetch(`${baseUrl}/api/demo-receiver/fail`, { method: "POST" });
  const failureBody = await failureResponse.json();
  assert.equal(failureResponse.status, 500);
  assert.equal(failureBody.success, false);
  assert.equal(failureBody.data, null);
});