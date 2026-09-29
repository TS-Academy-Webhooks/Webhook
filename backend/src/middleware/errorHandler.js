const { sendError } = require("../utils/apiResponse");

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  let statusCode = error.statusCode || error.status || 500;
  let message = error.message;

  if (error.code === 11000) {
    statusCode = 409;
    message = "A record with this value already exists";
  } else if (error.name === "ValidationError" || error.name === "CastError") {
    statusCode = 400;
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

  return sendError(res, message, statusCode);
}

module.exports = errorHandler;