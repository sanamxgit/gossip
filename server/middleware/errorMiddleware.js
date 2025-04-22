// Middleware for handling 404 errors (not found)
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Middleware for handling errors
const errorHandler = (err, req, res, next) => {
  // Check if headers have already been sent
  if (res.headersSent) {
    return next(err);
  }

  // Set status code
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);

  // Format error response
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    error: true,
  });
};

module.exports = { notFound, errorHandler }; 