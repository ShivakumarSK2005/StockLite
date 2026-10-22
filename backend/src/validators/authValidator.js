function validateLogin(req) {
  const errors = [];
  const { email, password } = req.body || {};

  if (!email || typeof email !== "string" || !email.trim()) {
    errors.push("Email is required");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.push("Please provide a valid email address");
  }

  if (!password || typeof password !== "string") {
    errors.push("Password is required");
  }

  return errors;
}

module.exports = {
  validateLogin,
};
