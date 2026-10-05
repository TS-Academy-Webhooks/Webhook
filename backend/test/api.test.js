const assert = require("node:assert/strict");
const { test } = require("node:test");
const crypto = require("node:crypto");
const path = require("node:path");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("../src/models/User");
const Shipment = require("../src/models/Shipment");
const RefreshSession = require("../src/models/RefreshSession");
const Webhook = require("../src/models/webhook");
const Event = require("../src/models/event");
const Delivery = require("../src/models/Delivery");
const DeliveryAttempt = require("../src/models/DeliveryAttempt");
const app = require("../src/app");
const validateWebhookUrl = require("../src/utils/validateWebhookUrl");
const { ALLOWED_STATUS_TRANSITIONS } = require("../src/services/shipmentService");
const authorizeRoles = require("../src/middleware/authorizeRoles");
const authService = require("../src/services/authService");
const { paginatedData } = require("../src/utils/apiResponse");
const legacyDataMigration = require("../src/services/legacyDataMigration");
const {
  buildDeliveryBody,
  canDeliverToWebhook,
  deliverWebhookOnce,
  readResponsePreview,
  signBody,
} = require("../src/services/webhookDelivery");
const {
  clearReceivedRequests,
  listReceivedRequests,
  recordReceivedRequest,
  verifySignatureWithSecrets,
} = require("../src/services/demoReceiver");

test("models validate required formats, defaults, and references", async () => {
  assert.deepEqual(User.schema.path("role").enumValues, ["admin", "customer"]);
  assert.equal(new User({ name: "Customer", email: "customer@example.com", passwordHash: "hash" }).role, "customer");
  assert.equal(User.schema.path("passwordHash").options.select, false);
  assert.equal(Webhook.schema.path("ownerId").options.ref, "User");
  assert.equal(Webhook.schema.path("secret").options.select, false);
  assert.ok(Webhook.schema.virtuals.active);
  assert.ok(Webhook.schema.virtuals.user);
  const generatedWebhook = new Webhook({
    ownerId: new mongoose.Types.ObjectId(),
    name: "Generated secret hook",
    url: "https://example.com/webhook",
    events: ["shipment.created"],
  });
  assert.match(generatedWebhook.secret, /^whsec_[a-f\d]{48}$/);
  assert.equal(Shipment.schema.path("customerId").options.ref, "User");
  assert.equal(RefreshSession.schema.path("tokenHash").options.select, false);

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
  assert.equal(shipment.toJSON().timeline[0].status, "created");
  assert.equal(shipment.toJSON().id, shipment._id.toString());
  await assert.rejects(new Shipment({
    trackingNumber: "TRK-12346",
    customer: "Test",
    origin: "A",
    destination: "B",
    amount: -1,
  }).validate(), mongoose.Error.ValidationError);

  const objectId = new mongoose.Types.ObjectId();
  await new Event({
    eventId: "evt_0123456789abcdef",
    type: "webhook.test",
    payload: { event: "webhook.test" },
  }).validate();
  assert.equal(Event.schema.path("shipmentId").options.required, undefined);
  assert.ok(Event.schema.virtuals.shipment);
  assert.equal(Delivery.schema.path("eventId").options.ref, "Event");
  assert.equal(Delivery.schema.path("webhookId").options.ref, "Webhook");
  assert.equal(Delivery.schema.path("ownerId").options.ref, "User");
  assert.equal(DeliveryAttempt.schema.path("eventId").options.ref, "Event");
  assert.equal(DeliveryAttempt.schema.path("deliveryId").options.ref, "Delivery");
  assert.ok(DeliveryAttempt.schema.indexes().some(([keys]) => keys.webhookId === 1 && keys.eventId === 1));

  const webhook = new Webhook({
    ownerId: objectId,
    name: "Example hook",
    url: "https://example.com/webhook",
    events: ["*"],
    secret: "whsec_test-secret",
  });
  await webhook.validate();
  const webhookJson = webhook.toJSON();
  assert.equal(webhookJson.id, webhook._id.toString());
  assert.equal(webhookJson.user.toString(), objectId.toString());
  assert.equal(webhookJson.active, true);

  const delivery = new Delivery({
    eventId: objectId,
    webhookId: objectId,
    ownerId: objectId,
    status: "success",
  });
  const deliveryJson = delivery.toJSON();
  assert.equal(deliveryJson.id, delivery._id.toString());
  assert.equal(deliveryJson.event.toString(), objectId.toString());
  assert.equal(deliveryJson.webhook.toString(), objectId.toString());
  assert.equal(deliveryJson.user.toString(), objectId.toString());

  const attemptJson = new DeliveryAttempt({
    deliveryId: delivery._id,
    webhookId: objectId,
    eventId: objectId,
    attemptNumber: 1,
    status: "success",
    httpStatus: 201,
    response: "ok",
    duration: 25,
  }).toJSON();
  assert.equal(attemptJson.statusCode, 201);
  assert.equal(attemptJson.responseBody, "ok");
  assert.equal(attemptJson.durationMs, 25);
  assert.equal(attemptJson.delivery.toString(), delivery._id.toString());
});

test("legacy migration field mappings are idempotent", () => {
  const objectId = new mongoose.Types.ObjectId();
  const applyPatch = (document, patch) => {
    const migrated = { ...document, ...patch.set };
    for (const field of Object.keys(patch.unset)) delete migrated[field];
    return migrated;
  };

  const legacyUser = { role: "merchant", password: "$2b$10$legacy-hash" };
  const migratedUser = applyPatch(legacyUser, legacyDataMigration.normalizeLegacyUser(legacyUser));
  assert.equal(migratedUser.role, "customer");
  assert.equal(migratedUser.passwordHash, legacyUser.password);
  assert.deepEqual(legacyDataMigration.normalizeLegacyUser(migratedUser), { set: {}, unset: {} });

  const timestamp = new Date("2025-01-01T00:00:00.000Z");
  const legacyShipment = {
    status: "picked_up",
    timeline: [{ status: "created", at: timestamp, note: "Received" }],
  };
  const migratedShipment = applyPatch(
    legacyShipment,
    legacyDataMigration.normalizeLegacyShipment(legacyShipment, objectId)
  );
  assert.equal(migratedShipment.customerId.toString(), objectId.toString());
  assert.deepEqual(migratedShipment.statusHistory, [{
    status: "created",
    timestamp,
    note: "Received",
  }]);
  assert.deepEqual(legacyDataMigration.normalizeLegacyShipment(migratedShipment), {
    set: {},
    unset: {},
  });

  const legacyEvent = { shipment: objectId };
  const migratedEvent = applyPatch(legacyEvent, legacyDataMigration.normalizeLegacyEvent(legacyEvent));
  assert.equal(migratedEvent.shipmentId.toString(), objectId.toString());
  assert.deepEqual(legacyDataMigration.normalizeLegacyEvent(migratedEvent), { set: {}, unset: {} });

  const legacyWebhook = { user: objectId, active: false };
  const migratedWebhook = applyPatch(
    legacyWebhook,
    legacyDataMigration.normalizeLegacyWebhook(legacyWebhook, objectId)
  );
  assert.equal(migratedWebhook.ownerId.toString(), objectId.toString());
  assert.equal(migratedWebhook.isActive, false);
  assert.deepEqual(
    legacyDataMigration.normalizeLegacyWebhook(migratedWebhook, objectId),
    { set: {}, unset: {} }
  );

  const legacyDelivery = {
    event: objectId,
    webhook: objectId,
    user: objectId,
    status: "success",
    attemptCount: 2,
    maxAttempts: 3,
  };
  const migratedDelivery = applyPatch(
    legacyDelivery,
    legacyDataMigration.normalizeLegacyDelivery(legacyDelivery, objectId)
  );
  assert.equal(migratedDelivery.eventId.toString(), objectId.toString());
  assert.equal(migratedDelivery.webhookId.toString(), objectId.toString());
  assert.equal(migratedDelivery.ownerId.toString(), objectId.toString());
  assert.deepEqual(
    legacyDataMigration.normalizeLegacyDelivery(migratedDelivery, objectId),
    { set: {}, unset: {} }
  );

  const legacyAttempt = {
    delivery: objectId,
    status: "failed",
    statusCode: 503,
    responseBody: "unavailable",
    durationMs: 50,
  };
  const migratedAttempt = applyPatch(
    legacyAttempt,
    legacyDataMigration.normalizeLegacyAttempt(legacyAttempt, {
      _id: objectId,
      webhookId: objectId,
      eventId: objectId,
    })
  );
  assert.equal(migratedAttempt.deliveryId.toString(), objectId.toString());
  assert.equal(migratedAttempt.httpStatus, 503);
  assert.equal(migratedAttempt.response, "unavailable");
  assert.equal(migratedAttempt.duration, 50);
  assert.deepEqual(
    legacyDataMigration.normalizeLegacyAttempt(migratedAttempt),
    { set: {}, unset: {} }
  );
});

test("pagination, webhook signatures, and demo receiver redaction are compatible", async () => {
  const page = paginatedData([{ id: "one" }], 2, 10, 11, "deliveries");
  assert.deepEqual(page.items, page.deliveries);
  assert.equal(page.pagination.total, 11);
  assert.equal(page.pagination.totalItems, 11);
  assert.equal(page.pagination.totalPages, 2);

  const customerId = new mongoose.Types.ObjectId();
  const otherCustomerId = new mongoose.Types.ObjectId();
  const eventWithShipment = { shipmentId: { customerId } };
  assert.equal(canDeliverToWebhook({
    ownerId: { _id: customerId, role: "customer" },
  }, eventWithShipment), true);
  assert.equal(canDeliverToWebhook({
    ownerId: { _id: otherCustomerId, role: "customer" },
  }, eventWithShipment), false);
  assert.equal(canDeliverToWebhook({
    ownerId: { _id: otherCustomerId, role: "admin" },
  }, eventWithShipment), true);

  const secret = "whsec_demo_secret";
  const payload = {
    event: "shipment.created",
    eventId: "evt_123456",
    shipmentId: "TRK-12345",
    status: "created",
  };
  assert.deepEqual(buildDeliveryBody({ payload }), payload);
  const rawBody = JSON.stringify(payload);
  const signature = signBody(rawBody, secret);
  assert.equal(
    signature,
    crypto.createHmac("sha256", secret).update(rawBody).digest("hex")
  );
  assert.equal(signature.startsWith("sha256="), false);
  assert.deepEqual(
    verifySignatureWithSecrets(rawBody, signature, null, [secret]),
    { valid: true, status: "valid", scheme: "legacy", timestampFresh: null }
  );

  const originalNodeEnv = process.env.NODE_ENV;
  const originalLocalhostFlag = process.env.ALLOW_LOCALHOST_WEBHOOKS;
  const originalFetch = global.fetch;
  const originalAttemptCreate = DeliveryAttempt.create;
  let outgoingRequest;
  process.env.NODE_ENV = "development";
  process.env.ALLOW_LOCALHOST_WEBHOOKS = "true";
  global.fetch = async (url, options) => {
    outgoingRequest = { url, ...options };
    return new Response("ok", { status: 200 });
  };
  DeliveryAttempt.create = async (attempt) => attempt;
  try {
    await deliverWebhookOnce(
      { _id: new mongoose.Types.ObjectId() },
      {
        _id: new mongoose.Types.ObjectId(),
        url: "http://localhost:3000/receiver",
        secret,
      },
      { _id: new mongoose.Types.ObjectId(), payload },
      1
    );
  } finally {
    global.fetch = originalFetch;
    DeliveryAttempt.create = originalAttemptCreate;
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    if (originalLocalhostFlag === undefined) delete process.env.ALLOW_LOCALHOST_WEBHOOKS;
    else process.env.ALLOW_LOCALHOST_WEBHOOKS = originalLocalhostFlag;
  }
  assert.equal(outgoingRequest.body, rawBody);
  assert.deepEqual(Object.keys(outgoingRequest.headers).sort(), [
    "Content-Type",
    "X-Webhook-Signature",
  ]);
  assert.equal(outgoingRequest.headers["X-Webhook-Signature"], signature);
  assert.equal(outgoingRequest.headers["X-Webhook-Timestamp"], undefined);

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const timestampedSignature = `sha256=${crypto.createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex")}`;
  assert.deepEqual(
    verifySignatureWithSecrets(rawBody, timestampedSignature, timestamp, [secret]),
    { valid: true, status: "valid", scheme: "timestamped", timestampFresh: true }
  );
  assert.equal(
    verifySignatureWithSecrets(`${rawBody} `, signature, timestamp, [secret]).valid,
    false
  );
  const staleTimestamp = String(Math.floor(Date.now() / 1000) - 600);
  const staleSignature = `sha256=${crypto.createHmac("sha256", secret)
    .update(`${staleTimestamp}.${rawBody}`)
    .digest("hex")}`;
  assert.equal(
    verifySignatureWithSecrets(rawBody, staleSignature, staleTimestamp, [secret]).valid,
    false
  );
  assert.equal((await readResponsePreview(new Response("x".repeat(12000)))).length, 1000);

  clearReceivedRequests();
  recordReceivedRequest({
    headers: {
      authorization: "Bearer secret",
      cookie: "session=secret",
      "x-webhook-signature": signature,
    },
    body: payload,
    rawBody,
    verification: { valid: true, status: "valid", scheme: "legacy", timestampFresh: null },
  });
  const { items, total } = listReceivedRequests({
    page: 1,
    limit: 10,
    signatureValid: "true",
    event: "shipment.created",
  });
  assert.equal(total, 1);
  assert.equal(items[0].headers.authorization, "[REDACTED]");
  assert.equal(items[0].headers.cookie, "[REDACTED]");
  assert.equal(items[0].headers["x-webhook-signature"], "[REDACTED]");
  clearReceivedRequests();
});

test("access tokens are short-lived and bound to a revocable session", () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "test-only-secret-with-at-least-32-characters";
  try {
    const userId = new mongoose.Types.ObjectId();
    const sessionId = new mongoose.Types.ObjectId();
    const token = authService.createAccessToken({ _id: userId }, sessionId);
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: authService.JWT_ISSUER,
      audience: authService.JWT_AUDIENCE,
    });
    assert.equal(payload.sub, userId.toString());
    assert.equal(payload.sid, sessionId.toString());
    assert.ok(payload.exp - payload.iat <= 15 * 60);
  } finally {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  }
});

test("role middleware allows admins and rejects customers from admin operations", () => {
  let adminError;
  authorizeRoles("admin")({ user: { role: "admin" } }, {}, (error) => { adminError = error; });
  assert.equal(adminError, undefined);

  let customerError;
  authorizeRoles("admin")({ user: { role: "customer" } }, {}, (error) => { customerError = error; });
  assert.equal(customerError.statusCode, 403);
});

test("refresh cookies are HttpOnly, scoped, and secure in production", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousSameSite = process.env.REFRESH_COOKIE_SAME_SITE;
  try {
    process.env.NODE_ENV = "production";
    process.env.REFRESH_COOKIE_SAME_SITE = "strict";
    let cookie;
    authService.setRefreshCookie({
      cookie(name, value, options) {
        cookie = { name, value, options };
      },
    }, "test-refresh-token");
    const options = cookie.options;
    assert.equal(cookie.name, "__Secure-refreshToken");
    assert.equal(cookie.value, "test-refresh-token");
    assert.equal(options.httpOnly, true);
    assert.equal(options.secure, true);
    assert.equal(options.sameSite, "strict");
    assert.equal(options.path, "/api/auth");
    assert.equal(authService.getRefreshCookieName(), "__Secure-refreshToken");

    process.env.NODE_ENV = "development";
    process.env.REFRESH_COOKIE_SAME_SITE = "none";
    assert.throws(() => authService.setRefreshCookie({ cookie() {} }, "test-token"), { statusCode: 500 });
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    if (previousSameSite === undefined) delete process.env.REFRESH_COOKIE_SAME_SITE;
    else process.env.REFRESH_COOKIE_SAME_SITE = previousSameSite;
  }
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

  const legacyHealthResponse = await fetch(`${baseUrl}/api/health`);
  assert.equal(legacyHealthResponse.status, 200);
  assert.equal((await legacyHealthResponse.json()).success, true);

  const docsResponse = await fetch(`${baseUrl}/api-docs`);
  assert.equal(docsResponse.status, 200);
  assert.match(await docsResponse.text(), /swagger-ui/i);
  const openApiResponse = await fetch(`${baseUrl}/api-docs/openapi.yaml`);
  assert.equal(openApiResponse.status, 200);
  assert.match(await openApiResponse.text(), /openapi: 3\.0\.3/);

  const protectedResponse = await fetch(`${baseUrl}/api/shipments`);
  const protectedBody = await protectedResponse.json();
  assert.equal(protectedResponse.status, 401);
  assert.equal(protectedBody.success, false);
  assert.equal(protectedBody.data, null);

  const missingMeResponse = await fetch(`${baseUrl}/api/auth/me`);
  assert.equal(missingMeResponse.status, 401);

  const weakRegistrationResponse = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Test", email: "weak@example.com", password: "short-pass", role: "admin" }),
  });
  assert.equal(weakRegistrationResponse.status, 400);
  assert.ok((await weakRegistrationResponse.json()).errors.length > 0);

  const emptyRefreshResponse = await fetch(`${baseUrl}/api/auth/refresh`, { method: "POST" });
  assert.equal(emptyRefreshResponse.status, 401);

  const trackingResponse = await fetch(`${baseUrl}/api/tracking/invalid`);
  assert.equal(trackingResponse.status, 400);

  const originalFindOne = Shipment.findOne;
  const lastUpdated = new Date("2025-01-01T00:00:00.000Z");
  let trackingFilter;
  try {
    Shipment.findOne = async (filter) => {
      trackingFilter = filter;
      return {
        trackingNumber: "TRK-12345",
        status: "created",
        origin: "A",
        destination: "B",
        statusHistory: [{ status: "created", timestamp: lastUpdated }],
        updatedAt: lastUpdated,
      };
    };
    const legacyTrackingResponse = await fetch(`${baseUrl}/api/tracking/trk-12345`);
    const legacyTracking = await legacyTrackingResponse.json();
    assert.equal(legacyTrackingResponse.status, 200);
    assert.deepEqual(trackingFilter, { trackingNumber: "TRK-12345" });
    assert.equal(legacyTracking.data.lastUpdate, lastUpdated.toISOString());
    assert.equal(legacyTracking.data.lastUpdated, lastUpdated.toISOString());
    assert.equal(legacyTracking.data.timeline[0].at, lastUpdated.toISOString());
  } finally {
    Shipment.findOne = originalFindOne;
  }

  const failureResponse = await fetch(`${baseUrl}/api/demo-receiver/fail`, { method: "POST" });
  const failureBody = await failureResponse.json();
  assert.equal(failureResponse.status, 500);
  assert.equal(failureBody.success, false);
  assert.equal(failureBody.data, null);

  const protectedDemoHistory = await fetch(`${baseUrl}/api/demo-receiver`);
  assert.equal(protectedDemoHistory.status, 401);

  const unknownApiResponse = await fetch(`${baseUrl}/api/not-a-real-endpoint`, {
    headers: { Accept: "text/html" },
  });
  const unknownApiBody = await unknownApiResponse.json();
  assert.equal(unknownApiResponse.status, 404);
  assert.equal(unknownApiBody.success, false);
  assert.equal(unknownApiBody.data, null);
  assert.doesNotMatch(JSON.stringify(unknownApiBody), /<!doctype html/i);
});

test("production static serving handles Vite assets and prerendered pages after API routes", async (t) => {
  const frontendDist = path.join(__dirname, "fixtures", "vite-dist");
  const frontendApp = app.createApp(frontendDist);
  const server = frontendApp.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => {
    server.closeAllConnections();
    server.close();
  });

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const root = await fetch(`${baseUrl}/`, { headers: { Accept: "text/html" } });
  assert.equal(root.status, 200);
  assert.match(await root.text(), /Vite root entry/);

  const prerendered = await fetch(`${baseUrl}/about/`, {
    headers: { Accept: "text/html" },
  });
  assert.equal(prerendered.status, 200);
  assert.match(await prerendered.text(), /Prerendered about page/);

  const marketingDocs = await fetch(`${baseUrl}/docs/`, {
    headers: { Accept: "text/html" },
  });
  assert.equal(marketingDocs.status, 200);
  assert.match(await marketingDocs.text(), /Prerendered API docs page/);

  const asset = await fetch(`${baseUrl}/assets/app.js.fixture`);
  assert.equal(asset.status, 200);
  assert.match(await asset.text(), /viteFixtureLoaded/);

  const spaFallback = await fetch(`${baseUrl}/dashboard`, {
    headers: { Accept: "text/html" },
  });
  assert.equal(spaFallback.status, 200);
  assert.equal(spaFallback.headers.get("x-robots-tag"), "noindex, nofollow");
  assert.match(await spaFallback.text(), /Vite root entry/);

  const missingAsset = await fetch(`${baseUrl}/assets/missing.js`);
  assert.equal(missingAsset.status, 404);

  const apiMiss = await fetch(`${baseUrl}/api/unknown`, {
    headers: { Accept: "text/html" },
  });
  assert.equal(apiMiss.status, 404);
  assert.equal((await apiMiss.json()).success, false);

  const noBuildServer = app.createApp(path.join(__dirname, "fixtures", "missing-build"))
    .listen(0, "127.0.0.1");
  await new Promise((resolve) => noBuildServer.once("listening", resolve));
  t.after(() => {
    noBuildServer.closeAllConnections();
    noBuildServer.close();
  });
  const noBuildRoot = await fetch(`http://127.0.0.1:${noBuildServer.address().port}/`);
  const noBuildBody = await noBuildRoot.json();
  assert.equal(noBuildRoot.status, 200);
  assert.equal(noBuildBody.success, true);
  assert.equal(noBuildBody.data.status, "ok");
});