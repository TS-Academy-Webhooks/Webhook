const express = require("express");
const router = express.Router();
const { getEvents } = require("../controllers/shipmentController");

router.get("/", getEvents);

module.exports = router;