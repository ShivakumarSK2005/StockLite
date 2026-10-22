const pool = require("../config/db");

async function listProducts({
  page = 1,
  limit = 20,
  search = "",
  category_id,
  stock_status,
  is_active = "true",
}) {
  const offset = (Number(page) - 1) * Number(limit);
  const whereClauses = [];
  const params = [];

  if (is_active !== "all") {
    whereClauses.push("p.is_active = ?");
    params.push(is_active === "true");
  }

  if (search) {
    whereClauses.push("(p.name LIKE ? OR p.sku LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }

  if (category_id) {
    whereClauses.push("p.category_id = ?");
    params.push(Number(category_id));
  }

  if (stock_status === "out_of_stock") {
    whereClauses.push("p.quantity = 0");
  } else if (stock_status === "low_stock") {
    whereClauses.push("p.quantity > 0 AND p.quantity <= p.reorder_level");
  } else if (stock_status === "in_stock") {
    whereClauses.push("p.quantity > p.reorder_level");
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const [countResult] = await pool.query(
    `SELECT COUNT(*) as total
     FROM products p
     JOIN categories c ON c.id = p.category_id
     ${whereSql}`,
    params
  );
  const total = countResult[0].total;

  const [rows] = await pool.query(
    `SELECT p.id, p.sku, p.name, p.category_id, c.name AS category_name,
            p.price, p.quantity, p.reorder_level, p.is_active,
            CAST(p.price * p.quantity AS DECIMAL(18,2)) AS inventory_value,
            CASE
              WHEN p.quantity = 0 THEN 'out_of_stock'
              WHEN p.quantity <= p.reorder_level THEN 'low_stock'
              ELSE 'in_stock'
            END AS stock_status,
            p.created_at, p.updated_at
     FROM products p
     JOIN categories c ON c.id = p.category_id
     ${whereSql}
     ORDER BY p.name ASC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );

  return {
    products: rows,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)) || 1,
    },
  };
}

async function getProductById(id) {
  const [rows] = await pool.query(
    `SELECT p.id, p.sku, p.name, p.category_id, c.name AS category_name,
            p.price, p.quantity, p.reorder_level, p.is_active,
            CAST(p.price * p.quantity AS DECIMAL(18,2)) AS inventory_value,
            CASE
              WHEN p.quantity = 0 THEN 'out_of_stock'
              WHEN p.quantity <= p.reorder_level THEN 'low_stock'
              ELSE 'in_stock'
            END AS stock_status,
            p.created_at, p.updated_at
     FROM products p
     JOIN categories c ON c.id = p.category_id
     WHERE p.id = ?`,
    [id]
  );

  if (rows.length === 0) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }
  return rows[0];
}

async function createProduct({
  sku,
  name,
  category_id,
  price,
  reorder_level = 5,
  initial_quantity = 0,
  userId = null,
}) {
  // Check if category exists
  const [cats] = await pool.query("SELECT id FROM categories WHERE id = ?", [category_id]);
  if (cats.length === 0) {
    const error = new Error("Category does not exist");
    error.statusCode = 400;
    throw error;
  }

  // Insert product with quantity 0
  const [result] = await pool.query(
    `INSERT INTO products (sku, name, category_id, price, quantity, reorder_level)
     VALUES (?, ?, ?, ?, 0, ?)`,
    [sku.trim().toUpperCase(), name.trim(), Number(category_id), Number(price), Number(reorder_level)]
  );

  const productId = result.insertId;

  // If user requested initial quantity > 0 and user is authenticated, call sp_stock_in procedure
  if (initial_quantity && Number(initial_quantity) > 0 && userId) {
    const connection = await pool.getConnection();
    try {
      await connection.query("CALL sp_stock_in(?, ?, ?, ?)", [
        productId,
        userId,
        Number(initial_quantity),
        "Initial stock upon product creation",
      ]);
    } finally {
      connection.release();
    }
  }

  return getProductById(productId);
}

async function updateProduct(id, { name, category_id, price, reorder_level, is_active }) {
  const updates = [];
  const params = [];

  if (name !== undefined) {
    updates.push("name = ?");
    params.push(name.trim());
  }

  if (category_id !== undefined) {
    const [cats] = await pool.query("SELECT id FROM categories WHERE id = ?", [category_id]);
    if (cats.length === 0) {
      const error = new Error("Category does not exist");
      error.statusCode = 400;
      throw error;
    }
    updates.push("category_id = ?");
    params.push(Number(category_id));
  }

  if (price !== undefined) {
    updates.push("price = ?");
    params.push(Number(price));
  }

  if (reorder_level !== undefined) {
    updates.push("reorder_level = ?");
    params.push(Number(reorder_level));
  }

  if (is_active !== undefined) {
    updates.push("is_active = ?");
    params.push(Boolean(is_active));
  }

  if (updates.length === 0) {
    return getProductById(id);
  }

  params.push(id);
  const [result] = await pool.query(
    `UPDATE products SET ${updates.join(", ")} WHERE id = ?`,
    params
  );

  if (result.affectedRows === 0) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  return getProductById(id);
}

async function deleteProduct(id) {
  // Check if product has associated stock movements
  const [movements] = await pool.query(
    "SELECT 1 FROM stock_movements WHERE product_id = ? LIMIT 1",
    [id]
  );

  if (movements.length > 0) {
    // Soft deactivation to preserve audit integrity
    await pool.query("UPDATE products SET is_active = FALSE WHERE id = ?", [id]);
    return {
      message: "Product has associated stock movement history. Product has been deactivated instead of permanently deleted to maintain audit integrity.",
      deactivated: true,
    };
  }

  const [result] = await pool.query("DELETE FROM products WHERE id = ?", [id]);
  if (result.affectedRows === 0) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  return { message: "Product deleted successfully", deleted: true };
}

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
