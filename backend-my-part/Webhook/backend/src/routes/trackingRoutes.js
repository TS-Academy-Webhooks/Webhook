const express = require("express");
const router = express.Router();
const { trackShipment } = require("../controllers/shipmentController");

router.get("/:trackingNumber", trackShipment);

module.exports = router;