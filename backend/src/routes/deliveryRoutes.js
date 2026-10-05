const express = require("express");
const { param, query } = require("express-validator");
const validateRequest = require("../middleware/validateRequest");
const deliveryController = require("../controllers/deliveryController");

const router = express.Router();

router.get(
  "/",
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer").toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100").toInt(),
  query("status").optional().isIn(["pending", "success", "failed"]).withMessage("Invalid delivery status"),
  query("webhookId").optional().isMongoId().withMessage("Invalid webhook ID"),
  query("eventId").optional().isMongoId().withMessage("Invalid event ID"),
  query("from").optional().isISO8601().withMessage("From must be a valid date"),
  query("to").optional().isISO8601().withMessage("To must be a valid date"),
  validateRequest,
  deliveryController.getDeliveries
);
router.get("/:id", param("id").isMongoId().withMessage("Invalid delivery ID"), validateRequest, deliveryController.getDelivery);
router.post("/:id/resend", param("id").isMongoId().withMessage("Invalid delivery ID"), validateRequest, deliveryController.resendDelivery);
router.post("/:id/retry", param("id").isMongoId().withMessage("Invalid delivery ID"), validateRequest, deliveryController.resendDelivery);

module.exports = router;