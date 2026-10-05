const { validationResult } = require("express-validator");
const AppError = require("../utils/AppError");

function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((error) => ({
      field: error.path || error.param || error.location,
      message: error.msg,
    }));
    return next(new AppError("Validation failed", 400, details));
  }

  return next();
}

module.exports = validateRequest;