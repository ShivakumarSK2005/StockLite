function validateCreateProduct(req) {
  const errors = [];
  const { sku, name, category_id, price, reorder_level } = req.body || {};

  if (!sku || typeof sku !== "string" || !sku.trim()) {
    errors.push("SKU is required");
  } else if (sku.trim().length > 64) {
    errors.push("SKU cannot exceed 64 characters");
  }

  if (!name || typeof name !== "string" || !name.trim()) {
    errors.push("Product name is required");
  } else if (name.trim().length > 180) {
    errors.push("Product name cannot exceed 180 characters");
  }

  if (!category_id || isNaN(Number(category_id)) || Number(category_id) <= 0) {
    errors.push("A valid category_id is required");
  }

  if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
    errors.push("Price must be a non-negative number");
  }

  if (reorder_level !== undefined && (isNaN(Number(reorder_level)) || Number(reorder_level) < 0 || !Number.isInteger(Number(reorder_level)))) {
    errors.push("Reorder level must be a non-negative integer");
  }

  return errors;
}

function validateUpdateProduct(req) {
  const errors = [];
  const { name, category_id, price, reorder_level, is_active } = req.body || {};

  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      errors.push("Product name cannot be empty");
    } else if (name.trim().length > 180) {
      errors.push("Product name cannot exceed 180 characters");
    }
  }

  if (category_id !== undefined && (isNaN(Number(category_id)) || Number(category_id) <= 0)) {
    errors.push("A valid category_id is required");
  }

  if (price !== undefined && (isNaN(Number(price)) || Number(price) < 0)) {
    errors.push("Price must be a non-negative number");
  }

  if (reorder_level !== undefined && (isNaN(Number(reorder_level)) || Number(reorder_level) < 0 || !Number.isInteger(Number(reorder_level)))) {
    errors.push("Reorder level must be a non-negative integer");
  }

  if (is_active !== undefined && typeof is_active !== "boolean") {
    errors.push("is_active must be a boolean");
  }

  // Explicitly warn or disallow quantity modification via product update
  if (req.body.quantity !== undefined) {
    errors.push("Product quantity cannot be modified directly. Use the stock-in, stock-out, or adjust endpoints.");
  }

  return errors;
}

module.exports = {
  validateCreateProduct,
  validateUpdateProduct,
};
