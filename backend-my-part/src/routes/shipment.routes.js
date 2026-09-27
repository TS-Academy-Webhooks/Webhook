const express = require("express");
const { protect, restrictTo } = require("../middleware/auth.middleware");
const {
  createShipment,
  getShipments,
  getShipment,
  updateShipmentStatus,
} = require("../controllers/shipment.controller");

const router = express.Router();

router.use(protect); // shipment management requires login

router.post("/", restrictTo("admin", "operations"), createShipment);
router.get("/", getShipments);
router.get("/:id", getShipment);
router.patch("/:id/status", restrictTo("admin", "operations"), updateShipmentStatus);

module.exports = router;
