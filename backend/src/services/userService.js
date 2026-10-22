const bcrypt = require("bcryptjs");
const pool = require("../config/db");

async function listUsers({ page = 1, limit = 20, search = "" }) {
  const offset = (Number(page) - 1) * Number(limit);
  const params = [];
  let where = "WHERE 1=1";

  if (search) {
    where += " AND (name LIKE ? OR email LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  const [countResult] = await pool.query(
    `SELECT COUNT(*) as total FROM users ${where}`,
    params
  );
  const total = countResult[0].total;

  const [rows] = await pool.query(
    `SELECT id, name, email, role, is_active, created_at, updated_at
     FROM users
     ${where}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );

  return {
    users: rows,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)) || 1,
    },
  };
}

async function getUserById(id) {
  const [rows] = await pool.query(
    "SELECT id, name, email, role, is_active, created_at, updated_at FROM users WHERE id = ?",
    [id]
  );
  if (rows.length === 0) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  return rows[0];
}

async function createUser({ name, email, password, role = "employee" }) {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const [result] = await pool.query(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
    [name.trim(), email.trim().toLowerCase(), passwordHash, role]
  );

  return {
    id: result.insertId,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role,
    is_active: true,
  };
}

async function updateUser(id, { name, role, is_active, password }) {
  const updates = [];
  const params = [];

  if (name !== undefined) {
    updates.push("name = ?");
    params.push(name.trim());
  }

  if (role !== undefined) {
    updates.push("role = ?");
    params.push(role);
  }

  if (is_active !== undefined) {
    updates.push("is_active = ?");
    params.push(is_active);
  }

  if (password) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    updates.push("password_hash = ?");
    params.push(passwordHash);
  }

  if (updates.length === 0) {
    return getUserById(id);
  }

  params.push(id);
  const [result] = await pool.query(
    `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
    params
  );

  if (result.affectedRows === 0) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return getUserById(id);
}

async function deleteUser(id) {
  // Check if user has associated stock movements
  const [movements] = await pool.query(
    "SELECT 1 FROM stock_movements WHERE user_id = ? LIMIT 1",
    [id]
  );

  if (movements.length > 0) {
    // Soft deactivation to protect audit trail
    await pool.query("UPDATE users SET is_active = FALSE WHERE id = ?", [id]);
    return {
      message: "User has recorded stock movements. Account was deactivated instead of deleted to protect audit history.",
      deactivated: true,
    };
  }

  const [result] = await pool.query("DELETE FROM users WHERE id = ?", [id]);
  if (result.affectedRows === 0) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return { message: "User deleted successfully", deleted: true };
}

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
