function validateCreateUser(req) {
  const errors = [];
  const { name, email, password, role } = req.body || {};

  if (!name || typeof name !== "string" || !name.trim()) {
    errors.push("Name is required");
  } else if (name.trim().length > 120) {
    errors.push("Name cannot exceed 120 characters");
  }

  if (!email || typeof email !== "string" || !email.trim()) {
    errors.push("Email is required");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.push("Please provide a valid email address");
  }

  if (!password || typeof password !== "string" || password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  if (role && !["admin", "employee"].includes(role)) {
    errors.push("Role must be either 'admin' or 'employee'");
  }

  return errors;
}

function validateUpdateUser(req) {
  const errors = [];
  const { name, role, is_active } = req.body || {};

  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      errors.push("Name cannot be empty");
    } else if (name.trim().length > 120) {
      errors.push("Name cannot exceed 120 characters");
    }
  }

  if (role !== undefined && !["admin", "employee"].includes(role)) {
    errors.push("Role must be either 'admin' or 'employee'");
  }

  if (is_active !== undefined && typeof is_active !== "boolean") {
    errors.push("is_active must be a boolean");
  }

  return errors;
}

module.exports = {
  validateCreateUser,
  validateUpdateUser,
};
