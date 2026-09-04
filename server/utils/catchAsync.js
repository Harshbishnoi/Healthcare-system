/**
 * Async error handler wrapper to eliminate repetitive try-catch boilerplate
 * and guarantee all unhandled rejections in controllers bubble to the global error middleware.
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = catchAsync;
