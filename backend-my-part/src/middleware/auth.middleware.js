const AppError = require("../utils/app-error");
const catchAsync = require("../utils/catch-async");
const { verifyToken } = require("../utils/jwt");
const User = require("../models/User");

// Require a valid JWT. Attaches the logged-in user to req.user.
const protect = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("You are not logged in", 401));
  }

  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    return next(new AppError("Invalid or expired session. Please log in again", 401));
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    return next(new AppError("The user for this session no longer exists", 401));
  }

  req.user = user;
  next();
});

// Require one of the given roles. Use AFTER protect.
// Example: restrictTo("admin", "operations")
function restrictTo(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to do this", 403));
    }
    next();
  };
}

module.exports = { protect, restrictTo };
