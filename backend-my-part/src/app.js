require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const connectDB = require("./config/db.config");
const errorHandler = require("./middleware/error.middleware");
const authRoutes = require("./routes/auth.routes");
const webhookRoutes = require("./routes/webhook.routes");
const shipmentRoutes = require("./routes/shipment.routes");
const trackingRoutes = require("./routes/tracking.routes");
const eventRoutes = require("./routes/event.routes");
const deliveryRoutes = require("./routes/delivery.routes");

const app = express();

connectDB();

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());
app.use(morgan("dev")); // logs each request to the console, helpful while developing

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "API is running", data: null });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/shipments", shipmentRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/deliveries", deliveryRoutes);

// Unknown route
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found", data: null });
});

// Global error handler — must be last
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
