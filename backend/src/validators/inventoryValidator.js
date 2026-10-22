function validateStockOperation(req) {
  const errors = [];
  const { quantity, note } = req.body || {};

  if (quantity === undefined || isNaN(Number(quantity)) || Number(quantity) <= 0 || !Number.isInteger(Number(quantity))) {
    errors.push("Quantity must be a positive integer greater than zero");
  }

  if (note !== undefined && note !== null) {
    if (typeof note !== "string") {
      errors.push("Note must be a string");
    } else if (note.length > 500) {
      errors.push("Note cannot exceed 500 characters");
    }
  }

  return errors;
}

function validateStockAdjustment(req) {
  const errors = [];
  const { new_quantity, delta, reason } = req.body || {};

  if (new_quantity === undefined && delta === undefined) {
    errors.push("Either 'new_quantity' or 'delta' is required");
  }

  if (new_quantity !== undefined && (isNaN(Number(new_quantity)) || Number(new_quantity) < 0 || !Number.isInteger(Number(new_quantity)))) {
    errors.push("New quantity must be a non-negative integer (0 or greater)");
  }

  if (delta !== undefined && (isNaN(Number(delta)) || Number(delta) === 0 || !Number.isInteger(Number(delta)))) {
    errors.push("Delta must be a non-zero integer");
  }

  if (!reason || typeof reason !== "string" || !reason.trim()) {
    errors.push("A reason is required for stock adjustments");
  } else if (reason.trim().length > 500) {
    errors.push("Reason cannot exceed 500 characters");
  }

  return errors;
}

module.exports = {
  validateStockOperation,
  validateStockAdjustment,
};
