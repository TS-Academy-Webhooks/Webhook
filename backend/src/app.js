const express = require("express");
const shipmentRoutes = require("./routes/shipmentRoutes");
const trackingRoutes = require("./routes/trackingRoutes");
const eventRoutes = require("./routes/eventRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const demoReceiverRoutes = require("./routes/demoReceiverRoutes");
const { sendSuccess } = require("./utils/apiResponse");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(express.json({
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

app.use("/api/shipments", shipmentRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/demo-receiver", demoReceiverRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;