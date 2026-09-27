const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const { getEvents, getEvent } = require("../controllers/event.controller");

const router = express.Router();

router.use(protect);

router.get("/", getEvents);
router.get("/:id", getEvent);

module.exports = router;
