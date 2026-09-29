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
  body("password").isString().isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
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

router.get("/me", authenticate, authController.me);

module.exports = router;