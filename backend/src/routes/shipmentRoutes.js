const express = require("express");
const { body, param, query } = require("express-validator");
const router = express.Router();
const validateRequest = require("../middleware/validateRequest");
const { SHIPMENT_STATUSES } = require("../services/shipmentService");
const {
  createShipment,
  getShipments,
  getShipment,
  updateShipmentStatus,
} = require("../controllers/shipmentController");

router.post(
  "/",
  body("customer").trim().notEmpty().withMessage("Customer is required"),
  body("origin").trim().notEmpty().withMessage("Origin is required"),
  body("destination").trim().notEmpty().withMessage("Destination is required"),
  body("amount").isFloat({ min: 0 }).withMessage("Amount must be zero or greater").toFloat(),
  validateRequest,
  createShipment
);

router.get(
  "/",
  query("search").optional().trim().isLength({ max: 100 }).withMessage("Search must be at most 100 characters"),
  query("status").optional().isIn(SHIPMENT_STATUSES).withMessage("Invalid shipment status"),
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer").toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100").toInt(),
  validateRequest,
  getShipments
);

router.get("/:id", param("id").isMongoId().withMessage("Invalid shipment ID"), validateRequest, getShipment);
router.patch(
  "/:id/status",
  param("id").isMongoId().withMessage("Invalid shipment ID"),
  body("status").isIn(SHIPMENT_STATUSES).withMessage("Invalid shipment status"),
  validateRequest,
  updateShipmentStatus
);

module.exports = router;