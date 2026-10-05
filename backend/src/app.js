const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const swaggerUi = require("swagger-ui-express");
const shipmentRoutes = require("./routes/shipmentRoutes");
const trackingRoutes = require("./routes/trackingRoutes");
const eventRoutes = require("./routes/eventRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const authRoutes = require("./routes/authRoutes");
const deliveryRoutes = require("./routes/deliveryRoutes");
const demoReceiverRoutes = require("./routes/demoReceiverRoutes");
const authenticate = require("./middleware/auth");
const authorizeRoles = require("./middleware/authorizeRoles");
const {
  authLimiter,
  demoReceiverLimiter,
  trackingLimiter,
} = require("./middleware/rateLimits");
const AppError = require("./utils/AppError");
const { sendSuccess } = require("./utils/apiResponse");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

function createApp(frontendDist = path.resolve(__dirname, "..", "..", "frontend", "dist")) {
  const app = express();
  const frontendIndex = path.join(frontendDist, "index.html");
  const hasFrontendBuild = fs.existsSync(frontendIndex);
  const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim());
  const demoReceiverEnabled = process.env.NODE_ENV !== "production" ||
    process.env.ENABLE_DEMO_RECEIVER === "true";

  app.use(helmet());
  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new AppError("Origin is not allowed", 403));
    },
    credentials: true,
  }));
  if (demoReceiverEnabled) {
    app.use("/api/demo-receiver", (req, res, next) => {
      if (req.method !== "POST") return next();
      return demoReceiverLimiter(req, res, next);
    });
  }
  app.use(cookieParser());
  app.use(express.json({
    limit: "1mb",
    verify(req, res, buffer) {
      req.rawBody = buffer.toString("utf8");
    },
  }));

  const healthCheck = (req, res) => sendSuccess(res, "API is healthy", { status: "ok" });
  app.get("/", (req, res, next) => {
    if (hasFrontendBuild) return next();
    return sendSuccess(res, "Logistics API is running", { status: "ok" });
  });
  app.get(["/health", "/api/health"], healthCheck);

  app.use("/api-docs", helmet.contentSecurityPolicy({
    directives: {
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
    },
  }));
  app.get("/api-docs/openapi.yaml", (req, res, next) => {
    res.type("application/yaml").sendFile(
      path.join(__dirname, "..", "openapi.yaml"),
      (error) => {
        if (error) next(error);
      }
    );
  });
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(null, {
    customSiteTitle: "Logistics Webhook API",
    swaggerOptions: {
      url: "/api-docs/openapi.yaml",
      withCredentials: true,
    },
  }));

  app.use("/api/auth", authLimiter, authRoutes);
  app.use("/api/shipments", authenticate, shipmentRoutes);
  app.use("/api/tracking", trackingLimiter, trackingRoutes);
  app.use("/api/events", authenticate, authorizeRoles("admin"), eventRoutes);
  app.use("/api/webhooks", authenticate, webhookRoutes);
  app.use("/api/deliveries", authenticate, deliveryRoutes);
  if (demoReceiverEnabled) {
    app.use("/api/demo-receiver", demoReceiverRoutes);
  }

  app.use("/api", notFound);
  if (hasFrontendBuild) {
    app.use(express.static(frontendDist));
    app.get(/.*/, (req, res, next) => {
      if (req.method !== "GET" || !req.accepts("html") || path.extname(req.path) ||
          req.path === "/api" || req.path.startsWith("/api/") ||
          req.path === "/health" || req.path === "/api-docs" ||
          req.path.startsWith("/api-docs/")) {
        return next();
      }
      res.setHeader("X-Robots-Tag", "noindex, nofollow");
      return res.sendFile(frontendIndex, (error) => {
        if (error) next(error);
      });
    });
  }
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

const app = createApp();
module.exports = app;
module.exports.createApp = createApp;
