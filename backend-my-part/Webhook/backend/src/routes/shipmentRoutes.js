const express = require("express");
const router = express.Router();
const {
  createShipment,
  getShipments,
  updateShipmentStatus,
} = require("../controllers/shipmentController");

router.post("/", createShipment);
router.get("/", getShipments);
router.patch("/:id/status", 
updateShipmentStatus);

module.exports = router;