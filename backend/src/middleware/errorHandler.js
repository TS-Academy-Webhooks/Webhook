const { sendError } = require("../utils/apiResponse");

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  let statusCode = error.statusCode || error.status || 500;
  let message = error.message;
  let validationErrors = Array.isArray(error.errors) ? error.errors : null;

  if (error.code === 11000) {
    statusCode = 409;
    message = "A record with this value already exists";
  } else if (error.name === "ValidationError" || error.name === "CastError") {
    statusCode = 400;
    if (error.name === "ValidationError") {
      validationErrors = Object.entries(error.errors || {}).map(([field, item]) => ({
        field,
        message: item.message,
      }));
    } else {
      validationErrors = [{ field: error.path, message: "Invalid value" }];
    }
  } else if (error instanceof SyntaxError && error.status === 400) {
    statusCode = 400;
    message = "Invalid JSON request body";
  }

  if (statusCode >= 500) {
    message = "Internal server error";
  }

  if (statusCode >= 500) {
    console.error(error);
  }

  if (Array.isArray(validationErrors) && validationErrors.length > 0) {
    return res.status(statusCode).json({
      success: false,
      message,
      data: null,
      errors: validationErrors,
    });
  }

  return sendError(res, message, statusCode);
}

module.exports = errorHandler;