const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const {
  getDeliveries,
  getDelivery,
  resendDelivery,
} = require("../controllers/delivery.controller");

const router = express.Router();

router.use(protect);

router.get("/", getDeliveries);
router.get("/:id", getDelivery);
router.post("/:id/resend", resendDelivery);
router.post("/:id/retry", resendDelivery); // alias, same behaviour

module.exports = router;
