const express = require("express");
const router = express.Router();
const {
  createWebhook,
  getWebhooks,
  getWebhookDeliveries,
} = require("../controllers/webhookController");

router.post("/", createWebhook);
router.get("/", getWebhooks);
router.get("/:id/deliveries", getWebhookDeliveries);

module.exports = router;