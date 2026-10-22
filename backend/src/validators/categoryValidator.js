function validateCategory(req) {
  const errors = [];
  const { name, description } = req.body || {};

  if (!name || typeof name !== "string" || !name.trim()) {
    errors.push("Category name is required");
  } else if (name.trim().length > 100) {
    errors.push("Category name cannot exceed 100 characters");
  }

  if (description !== undefined && description !== null) {
    if (typeof description !== "string") {
      errors.push("Description must be a string");
    } else if (description.length > 500) {
      errors.push("Description cannot exceed 500 characters");
    }
  }

  return errors;
}

module.exports = {
  validateCategory,
};
