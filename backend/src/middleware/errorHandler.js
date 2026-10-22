function errorHandler(err, req, res, next) {
  // Always log detailed errors on the server
  console.error(`[${new Date().toISOString()}] ERROR:`, err);

  if (res.headersSent) {
    return next(err);
  }

  // Custom operational errors with explicit status code
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || undefined,
    });
  }

  // MySQL specific errors
  if (err.code === "ER_DUP_ENTRY") {
    let field = "entry";
    if (err.message.includes("uq_products_sku")) field = "SKU";
    else if (err.message.includes("uq_categories_name")) field = "Category name";
    else if (err.message.includes("uq_users_email")) field = "Email";

    return res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists`,
    });
  }

  if (err.code === "ER_ROW_IS_REFERENCED_2") {
    return res.status(409).json({
      success: false,
      message: "Cannot delete or modify record because it is referenced by other data",
    });
  }

  if (err.code === "ER_NO_REFERENCED_ROW_2") {
    return res.status(400).json({
      success: false,
      message: "Referenced parent record does not exist",
    });
  }

  // Stored procedure SIGNAL SQLSTATE '45000'
  if (err.sqlState === "45000") {
    return res.status(400).json({
      success: false,
      message: err.sqlMessage || err.message,
    });
  }

  // Default internal server error
  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
}

module.exports = errorHandler;
