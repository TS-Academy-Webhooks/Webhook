const express = require("express");
const { trackShipment } = require("../controllers/tracking.controller");

const router = express.Router();

// Public — no auth. Customers use this without an account.
router.get("/:trackingNumber", trackShipment);

module.exports = router;
