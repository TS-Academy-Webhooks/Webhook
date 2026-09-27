// This runs whenever a route calls next(err), or an async controller
// wrapped in catchAsync throws. It must be registered LAST in app.js,
// after all the routes.
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong";
  let errors = err.errors || null;

  // Mongoose bad ObjectId (e.g. /api/webhooks/not-a-real-id)
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
    errors = null;
  }

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Mongoose duplicate key (e.g. email already registered)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} is already in use`;
    errors = null;
  }

  // Never leak stack traces or internal error details to the client.
  // Log the full error on the server for debugging.
  if (statusCode === 500) {
    console.error("UNEXPECTED ERROR:", err);
    message = "Something went wrong";
    errors = null;
  }

  res.status(statusCode).json({
    success: false,
    message,
    data: null,
    ...(errors ? { errors } : {}),
  });
}

module.exports = errorHandler;
