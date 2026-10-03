// A predictable error we can throw anywhere in the app.
// Anything NOT thrown as an AppError is treated as an unexpected bug
// and hidden from the client as "Something went wrong".
class AppError extends Error {
  constructor(message, statusCode, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors; // optional array of { field, message } for validation
    this.isOperational = true; // marks this as a "known" error, not a crash
  }
}

module.exports = AppError;
