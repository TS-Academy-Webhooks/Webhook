const express = require("express");
const { body, param, query } = require("express-validator");
const router = express.Router();
const validateRequest = require("../middleware/validateRequest");
const eventTypes = require("../utils/eventTypes");
const {
  createWebhook,
  getWebhooks,
  getWebhook,
  updateWebhook,
  deleteWebhook,
  getWebhookDeliveries,
} = require("../controllers/webhookController");

const webhookId = param("id").isMongoId().withMessage("Invalid webhook ID");

router.post(
  "/",
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("url").isURL({ protocols: ["http", "https"], require_protocol: true }).withMessage("A valid http or https URL is required"),
  body("events").isArray({ min: 1 }).withMessage("Select at least one event"),
  body("events.*").isIn(eventTypes).withMessage("Invalid webhook event"),
  validateRequest,
  createWebhook
);
router.get("/", getWebhooks);
router.get(
  "/:id/deliveries",
  webhookId,
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer").toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100").toInt(),
  query("status").optional().isIn(["success", "failed"]).withMessage("Invalid delivery status"),
  validateRequest,
  getWebhookDeliveries
);
router.get("/:id", webhookId, validateRequest, getWebhook);
router.patch(
  "/:id",
  webhookId,
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
  body("url").optional().isURL({ protocols: ["http", "https"], require_protocol: true }).withMessage("A valid http or https URL is required"),
  body("events").optional().isArray({ min: 1 }).withMessage("Select at least one event"),
  body("events.*").optional().isIn(eventTypes).withMessage("Invalid webhook event"),
  body("active").optional().isBoolean().withMessage("Active must be true or false").toBoolean(),
  validateRequest,
  updateWebhook
);
router.delete("/:id", webhookId, validateRequest, deleteWebhook);

module.exports = router;