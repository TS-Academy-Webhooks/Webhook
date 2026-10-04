const express = require("express");
const { body } = require("express-validator");
const authenticate = require("../middleware/auth");
const validateRequest = require("../middleware/validateRequest");
const authController = require("../controllers/authController");

const router = express.Router();

router.post(
  "/register",
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password").isString().isLength({ min: 12 }).withMessage("Password must be at least 12 characters"),
  validateRequest,
  authController.register
);

router.post(
  "/login",
  body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password").isString().notEmpty().withMessage("Password is required"),
  validateRequest,
  authController.login
);

router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.post(
  "/change-password",
  authenticate,
  body("currentPassword").isString().notEmpty().withMessage("Current password is required"),
  body("newPassword").isString().isLength({ min: 12 }).withMessage("New password must be at least 12 characters"),
  validateRequest,
  authController.changePassword
);
router.get("/me", authenticate, authController.me);

module.exports = router;