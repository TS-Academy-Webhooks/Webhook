const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/AppError");

async function authenticate(req, res, next) {
  const authorization = req.get("Authorization") || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new AppError("Authentication required", 401));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) {
      return next(new AppError("Authentication required", 401));
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(new AppError("Invalid or expired token", 401));
  }
}

module.exports = authenticate;