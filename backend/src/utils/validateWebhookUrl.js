const dns = require("node:dns/promises");
const net = require("node:net");
const AppError = require("./AppError");

function isPrivateAddress(address) {
  const normalized = address.replace(/^\[|\]$/g, "").toLowerCase();
  const version = net.isIP(normalized);

  if (version === 4) {
    const [first, second] = normalized.split(".").map(Number);
    return first === 0 || first === 10 || first === 127 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) || first >= 224;
  }

  if (version === 6) {
    return normalized === "::" || normalized === "::1" ||
      normalized.startsWith("fc") || normalized.startsWith("fd") ||
      /^fe[89ab]/.test(normalized) || normalized.startsWith("ff") ||
      normalized.startsWith("::ffff:");
  }

  return true;
}

function isLocalhost(hostname) {
  return hostname === "localhost" || hostname.endsWith(".localhost") ||
    (net.isIP(hostname) === 4 && hostname.startsWith("127.")) ||
    hostname === "::1" || hostname === "[::1]";
}

async function validateWebhookUrl(value) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new AppError("Webhook URL must be a valid http or https URL", 400);
  }

  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new AppError("Webhook URL must use http or https and cannot include credentials", 400);
  }

  const hostname = parsed.hostname.toLowerCase();
  const localhostAllowed = process.env.NODE_ENV !== "production" &&
    process.env.ALLOW_LOCALHOST_WEBHOOKS === "true";

  if (isLocalhost(hostname) && !localhostAllowed) {
    throw new AppError("Localhost webhook URLs require ALLOW_LOCALHOST_WEBHOOKS=true outside production", 400);
  }

  if (process.env.NODE_ENV === "production") {
    let addresses;
    try {
      addresses = net.isIP(hostname.replace(/^\[|\]$/g, ""))
        ? [{ address: hostname.replace(/^\[|\]$/g, "") }]
        : await dns.lookup(hostname, { all: true, verbatim: true });
    } catch {
      throw new AppError("Webhook hostname could not be resolved", 400);
    }

    if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
      throw new AppError("Private and localhost webhook addresses are blocked in production", 400);
    }
  }

  return parsed.toString();
}

module.exports = validateWebhookUrl;