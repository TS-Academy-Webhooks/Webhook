const crypto = require("crypto");
const Webhook = require("../models/webhook");

const MAX_RECEIVED_REQUESTS = 100;
const MAX_CAPTURED_BODY_LENGTH = 64 * 1024;
const REDACTED_HEADER_NAMES = new Set([
  "authorization",
  "cookie",
  "proxy-authorization",
  "set-cookie",
  "x-api-key",
  "x-webhook-signature",
]);

const receivedRequests = [];
const DEFAULT_RESPONSE_PROFILES = {
  success: { statusCode: 201 },
  failure: {
    statusCode: 500,
    body: {
      success: false,
      message: "Demo Receiver forced a failure",
      data: null,
    },
  },
};
let responseProfiles = structuredClone(DEFAULT_RESPONSE_PROFILES);

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function isTimestampFresh(timestamp) {
  const timestampSeconds = Number(timestamp);
  return Number.isInteger(timestampSeconds) &&
    Math.abs(Date.now() / 1000 - timestampSeconds) <= 300;
}

function isValidSignature(signature) {
  return typeof signature === "string" &&
    /^[a-f\d]{64}$/i.test(signature.replace(/^sha256=/i, ""));
}

function compareSignature(rawBody, signature, secret, timestamp) {
  const normalized = signature.replace(/^sha256=/i, "");
  const expected = crypto.createHmac("sha256", secret)
    .update(timestamp === null ? rawBody : `${timestamp}.${rawBody}`)
    .digest();
  const received = Buffer.from(normalized, "hex");
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

function verifySignatureWithSecrets(rawBody, signature, timestamp, secrets) {
  if (!signature) {
    return { valid: null, status: "missing", scheme: null, timestampFresh: null };
  }

  const timestampFresh = timestamp ? isTimestampFresh(timestamp) : null;
  if (!isValidSignature(signature)) {
    return {
      valid: false,
      status: "invalid",
      scheme: "unknown",
      timestampFresh,
    };
  }

  for (const secret of secrets) {
    if (timestampFresh && compareSignature(rawBody, signature, secret, String(timestamp))) {
      return {
        valid: true,
        status: "valid",
        scheme: "timestamped",
        timestampFresh: true,
      };
    }
    if (compareSignature(rawBody, signature, secret, null)) {
      return {
        valid: true,
        status: "valid",
        scheme: "legacy",
        timestampFresh,
      };
    }
  }

  return {
    valid: false,
    status: "invalid",
    scheme: "unknown",
    timestampFresh,
  };
}

async function verifySignature(rawBody, signature, timestamp) {
  if (!signature) {
    return verifySignatureWithSecrets(rawBody, signature, timestamp, []);
  }
  const webhooks = await Webhook.find({}).select("+secret");
  return verifySignatureWithSecrets(
    rawBody,
    signature,
    timestamp,
    webhooks.map((webhook) => webhook.secret).filter(Boolean)
  );
}

function sanitizeHeaders(headers) {
  return Object.fromEntries(Object.entries(headers).map(([name, value]) => [
    name,
    REDACTED_HEADER_NAMES.has(name.toLowerCase()) ? "[REDACTED]" : value,
  ]));
}

function captureBody(body, rawBody) {
  const rawBytes = Buffer.from(rawBody || "", "utf8");
  if (rawBytes.length > MAX_CAPTURED_BODY_LENGTH) {
    const preview = rawBytes.subarray(0, MAX_CAPTURED_BODY_LENGTH).toString("utf8");
    return {
      body: { truncated: true, preview },
      rawBody: preview,
      bodyTruncated: true,
    };
  }

  return {
    body: clone(body),
    rawBody: rawBody || "",
    bodyTruncated: false,
  };
}

function recordReceivedRequest({ headers, body, rawBody, verification }) {
  const capturedBody = captureBody(body, rawBody);
  const eventHeader = headers["x-webhook-event"];
  const eventType = typeof body?.type === "string"
    ? body.type
    : typeof body?.event === "string"
      ? body.event
      : typeof eventHeader === "string"
        ? eventHeader
        : null;
  const received = {
    headers: sanitizeHeaders(headers),
    ...capturedBody,
    timestamp: new Date().toISOString(),
    eventType,
    signatureValid: verification.valid,
    signature: verification,
  };

  receivedRequests.unshift(received);
  receivedRequests.length = Math.min(receivedRequests.length, MAX_RECEIVED_REQUESTS);
  return clone(received);
}

function listReceivedRequests({ page, limit, signatureValid, event }) {
  const filteredRequests = receivedRequests.filter((request) => {
    if (signatureValid === "true" && request.signatureValid !== true) return false;
    if (signatureValid === "false" && request.signatureValid !== false) return false;
    if (signatureValid === "unknown" && request.signatureValid !== null) return false;
    if (event && request.eventType !== event) return false;
    return true;
  });
  const start = (page - 1) * limit;
  return {
    items: clone(filteredRequests.slice(start, start + limit)),
    total: filteredRequests.length,
  };
}

function clearReceivedRequests() {
  const clearedCount = receivedRequests.length;
  receivedRequests.length = 0;
  return clearedCount;
}

function getResponseProfiles() {
  return clone(responseProfiles);
}

function getResponseProfile(name) {
  return clone(responseProfiles[name]);
}

function updateResponseProfiles(updates) {
  for (const name of ["success", "failure"]) {
    if (updates[name]) {
      Object.assign(responseProfiles[name], clone(updates[name]));
    }
  }
  return getResponseProfiles();
}

function resetResponseProfiles() {
  responseProfiles = clone(DEFAULT_RESPONSE_PROFILES);
  return getResponseProfiles();
}

module.exports = {
  MAX_CAPTURED_BODY_LENGTH,
  MAX_RECEIVED_REQUESTS,
  clearReceivedRequests,
  getResponseProfile,
  getResponseProfiles,
  listReceivedRequests,
  recordReceivedRequest,
  resetResponseProfiles,
  updateResponseProfiles,
  verifySignature,
  verifySignatureWithSecrets,
};
