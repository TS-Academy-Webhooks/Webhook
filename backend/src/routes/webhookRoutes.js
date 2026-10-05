const express = require("express");
const { body, param, query } = require("express-validator");
const validateRequest = require("../middleware/validateRequest");
const eventTypes = require("../utils/eventTypes");
const {
  createWebhook,
  getWebhooks,
  getWebhook,
  updateWebhook,
  deleteWebhook,
  getWebhookDeliveries,
  testWebhook,
} = require("../controllers/webhookController");

const router = express.Router();
const webhookId = () => param("id").isMongoId().withMessage("Invalid webhook ID");
const isWebhookEvent = (value) => value === "*" || eventTypes.includes(value);
const updateValidators = () => [
  webhookId(),
  body("name").optional().trim().isLength({ min: 2, max: 80 })
    .withMessage("Name must be between 2 and 80 characters"),
  body("url").optional().isURL({
    protocols: ["http", "https"],
    require_protocol: true,
  }).withMessage("A valid http or https URL is required"),
  body("events").optional().isArray({ min: 1 })
    .withMessage("Select at least one event"),
  body("events.*").optional().custom(isWebhookEvent)
    .withMessage("Invalid webhook event"),
  body("active").optional().isBoolean()
    .withMessage("Active must be true or false").toBoolean(),
  body("isActive").optional().isBoolean()
    .withMessage("isActive must be true or false").toBoolean(),
  body("regenerateSecret").optional().isBoolean()
    .withMessage("regenerateSecret must be true or false").toBoolean(),
  validateRequest,
];

router.post(
  "/",
  body("name").trim().isLength({ min: 2, max: 80 })
    .withMessage("Name must be between 2 and 80 characters"),
  body("url").isURL({
    protocols: ["http", "https"],
    require_protocol: true,
  }).withMessage("A valid http or https URL is required"),
  body("events").isArray({ min: 1 }).withMessage("Select at least one event"),
  body("events.*").custom(isWebhookEvent).withMessage("Invalid webhook event"),
  body("active").optional().isBoolean()
    .withMessage("Active must be true or false").toBoolean(),
  body("isActive").optional().isBoolean()
    .withMessage("isActive must be true or false").toBoolean(),
  validateRequest,
  createWebhook
);
router.get(
  "/",
  query("search").optional().trim().isLength({ max: 100 })
    .withMessage("Search must be at most 100 characters"),
  query("active").optional().isBoolean()
    .withMessage("Active must be true or false").toBoolean(),
  query("isActive").optional().isBoolean()
    .withMessage("isActive must be true or false").toBoolean(),
  query("event").optional().custom(isWebhookEvent)
    .withMessage("Invalid webhook event"),
  query("page").optional().isInt({ min: 1 })
    .withMessage("Page must be a positive integer").toInt(),
  query("limit").optional().isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50").toInt(),
  validateRequest,
  getWebhooks
);
router.get(
  "/:id/deliveries",
  webhookId(),
  query("page").optional().isInt({ min: 1 })
    .withMessage("Page must be a positive integer").toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100").toInt(),
  query("status").optional().isIn(["pending", "success", "failed"])
    .withMessage("Invalid delivery status"),
  validateRequest,
  getWebhookDeliveries
);
router.post("/:id/test", webhookId(), validateRequest, testWebhook);
router.get("/:id", webhookId(), validateRequest, getWebhook);
router.patch("/:id", ...updateValidators(), updateWebhook);
router.put("/:id", ...updateValidators(), updateWebhook);
router.delete("/:id", webhookId(), validateRequest, deleteWebhook);

module.exports = router;
