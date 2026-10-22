const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

async function login(email, password) {
  const [rows] = await pool.query(
    "SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = ?",
    [email.trim().toLowerCase()]
  );

  if (rows.length === 0) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const user = rows[0];

  if (!user.is_active) {
    const error = new Error("Account has been deactivated. Please contact an administrator.");
    error.statusCode = 403;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const secret = process.env.JWT_SECRET || "default_stocklite_secret";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

  const token = jwt.sign(
    { userId: user.id, role: user.role, email: user.email },
    secret,
    { expiresIn }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

module.exports = {
  login,
};
