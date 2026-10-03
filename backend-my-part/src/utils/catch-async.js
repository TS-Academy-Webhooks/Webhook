// Wrap async controller functions with this so we don't need
// try/catch in every single controller. Any rejected promise
// (thrown error) gets passed to next(), which sends it to
// our error-handling middleware in app.js.
function catchAsync(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = catchAsync;
