function errorHandler(err, req, res, next) {
    console.error("=================================");
    console.error("SERVER ERROR");
    console.error("=================================");
    console.error(err);
    console.error("=================================");

    const statusCode =
        err.statusCode ||
        err.status ||
        500;

    res.status(statusCode).json({
        success: false,
        message:
            err.message ||
            "Internal server error.",
        ...(process.env.NODE_ENV === "development"
            ? {
                  error: err.stack
              }
            : {})
    });
}

module.exports = errorHandler;