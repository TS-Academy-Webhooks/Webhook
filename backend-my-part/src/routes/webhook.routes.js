const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const {
  createWebhook,
  getWebhooks,
  getWebhook,
  updateWebhook,
  deleteWebhook,
  getWebhookDeliveries,
  testWebhook,
} = require("../controllers/webhook.controller");

const router = express.Router();

router.use(protect); // every webhook route requires login

router.post("/", createWebhook);
router.get("/", getWebhooks);
router.get("/:id", getWebhook);
router.put("/:id", updateWebhook);
router.delete("/:id", deleteWebhook);
router.get("/:id/deliveries", getWebhookDeliveries);
router.post("/:id/test", testWebhook);

module.exports = router;
