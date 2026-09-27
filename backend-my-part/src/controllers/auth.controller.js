const User = require("../models/User");
const AppError = require("../utils/app-error");
const catchAsync = require("../utils/catch-async");
const { signToken } = require("../utils/jwt");

// POST /api/auth/register
exports.register = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;

  const errors = [];
  if (!name || name.trim().length < 2) {
    errors.push({ field: "name", message: "Name must be at least 2 characters" });
  }
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    errors.push({ field: "email", message: "A valid email is required" });
  }
  if (!password || password.length < 8) {
    errors.push({ field: "password", message: "Password must be at least 8 characters" });
  }
  if (errors.length > 0) {
    return next(new AppError("Validation failed", 400, errors));
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return next(new AppError("Email is already registered", 409));
  }

  const user = await User.create({ name, email, password });
  const token = signToken(user._id);

  res.status(201).json({
    success: true,
    message: "Account created successfully",
    data: { user, token },
  });
});

// POST /api/auth/login
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Email and password are required", 400));
  }

  //password has select:false on the model, so ask for it explicitly here
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    // Same message whether the email or password is wrong
    // this avoids telling an attacker which part was incorrect.
    return next(new AppError("Invalid email or password", 401));
  }

  const token = signToken(user._id);
  user.password = undefined;

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: { user, token },
  });
});

// GET /api/auth/me
exports.getMe = catchAsync(async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Current user retrieved",
    data: req.user,
  });
});
