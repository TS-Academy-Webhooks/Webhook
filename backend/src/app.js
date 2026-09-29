const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const shipmentRoutes = require("./routes/shipmentRoutes");
const trackingRoutes = require("./routes/trackingRoutes");
const eventRoutes = require("./routes/eventRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const authRoutes = require("./routes/authRoutes");
const deliveryRoutes = require("./routes/deliveryRoutes");
const demoReceiverRoutes = require("./routes/demoReceiverRoutes");
const authenticate = require("./middleware/auth");
const { authLimiter, trackingLimiter } = require("./middleware/rateLimits");
const AppError = require("./utils/AppError");
const { sendSuccess } = require("./utils/apiResponse");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

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
app.use(express.json({
  limit: "1mb",
  verify(req, res, buffer) {
    req.rawBody = buffer.toString("utf8");
  },
}));

app.get("/", (req, res) => {
  return sendSuccess(res, "Logistics API is running", { status: "ok" });
});

app.get("/health", (req, res) => {
  return sendSuccess(res, "API is healthy", { status: "ok" });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/shipments", authenticate, shipmentRoutes);
app.use("/api/tracking", trackingLimiter, trackingRoutes);
app.use("/api/events", authenticate, eventRoutes);
app.use("/api/webhooks", authenticate, webhookRoutes);
app.use("/api/deliveries", authenticate, deliveryRoutes);
app.use("/api/demo-receiver", demoReceiverRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;