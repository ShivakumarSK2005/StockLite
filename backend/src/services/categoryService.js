const pool = require("../config/db");

async function listCategories() {
  const [rows] = await pool.query(
    `SELECT c.id, c.name, c.description, c.created_at, c.updated_at,
            COUNT(p.id) AS product_count
     FROM categories c
     LEFT JOIN products p ON p.category_id = c.id AND p.is_active = TRUE
     GROUP BY c.id
     ORDER BY c.name ASC`
  );
  return rows;
}

async function getCategoryById(id) {
  const [rows] = await pool.query(
    `SELECT c.id, c.name, c.description, c.created_at, c.updated_at,
            COUNT(p.id) AS product_count
     FROM categories c
     LEFT JOIN products p ON p.category_id = c.id AND p.is_active = TRUE
     WHERE c.id = ?
     GROUP BY c.id`,
    [id]
  );

  if (rows.length === 0) {
    const error = new Error("Category not found");
    error.statusCode = 404;
    throw error;
  }
  return rows[0];
}

async function createCategory({ name, description }) {
  const [result] = await pool.query(
    "INSERT INTO categories (name, description) VALUES (?, ?)",
    [name.trim(), description ? description.trim() : null]
  );

  return getCategoryById(result.insertId);
}

async function updateCategory(id, { name, description }) {
  const updates = [];
  const params = [];

  if (name !== undefined) {
    updates.push("name = ?");
    params.push(name.trim());
  }

  if (description !== undefined) {
    updates.push("description = ?");
    params.push(description ? description.trim() : null);
  }

  if (updates.length === 0) {
    return getCategoryById(id);
  }

  params.push(id);
  const [result] = await pool.query(
    `UPDATE categories SET ${updates.join(", ")} WHERE id = ?`,
    params
  );

  if (result.affectedRows === 0) {
    const error = new Error("Category not found");
    error.statusCode = 404;
    throw error;
  }

  return getCategoryById(id);
}

async function deleteCategory(id) {
  // Check if any products reference this category
  const [products] = await pool.query(
    "SELECT 1 FROM products WHERE category_id = ? LIMIT 1",
    [id]
  );

  if (products.length > 0) {
    const error = new Error("Cannot delete category with associated products. Reassign or delete the products first.");
    error.statusCode = 409;
    throw error;
  }

  const [result] = await pool.query("DELETE FROM categories WHERE id = ?", [id]);
  if (result.affectedRows === 0) {
    const error = new Error("Category not found");
    error.statusCode = 404;
    throw error;
  }

  return { message: "Category deleted successfully" };
}

module.exports = {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
