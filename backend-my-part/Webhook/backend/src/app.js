require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const shipmentRoutes = require("./routes/shipmentRoutes");
const trackingRoutes = require("./routes/trackingRoutes");
const eventRoutes = require("./routes/eventRoutes");
const webhookRoutes = require("./routes/webhookRoutes");

const app = express();

connectDB();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ success: true, message: "Logistics API is running 🚀" });
});

app.use("/api/shipments", shipmentRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/webhooks", webhookRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});