const pool = require("../config/db");

async function stockIn(productId, userId, quantity, note = null) {
  const connection = await pool.getConnection();
  try {
    const [resultSets] = await connection.query("CALL sp_stock_in(?, ?, ?, ?)", [
      Number(productId),
      Number(userId),
      Number(quantity),
      note ? note.trim() : null,
    ]);

    // mysql2 returns procedure SELECT results in resultSets[0]
    const operationResult = resultSets[0][0];
    return operationResult;
  } finally {
    connection.release();
  }
}

async function stockOut(productId, userId, quantity, note = null) {
  const connection = await pool.getConnection();
  try {
    const [resultSets] = await connection.query("CALL sp_stock_out(?, ?, ?, ?)", [
      Number(productId),
      Number(userId),
      Number(quantity),
      note ? note.trim() : null,
    ]);

    const operationResult = resultSets[0][0];
    return operationResult;
  } finally {
    connection.release();
  }
}

async function adjustStock(productId, userId, { delta, new_quantity, reason }) {
  let adjustmentDelta = delta;

  if (adjustmentDelta === undefined && new_quantity !== undefined) {
    const [rows] = await pool.query(
      "SELECT quantity FROM products WHERE id = ? AND is_active = TRUE",
      [productId]
    );
    if (rows.length === 0) {
      const error = new Error("Active product not found");
      error.statusCode = 404;
      throw error;
    }
    adjustmentDelta = Number(new_quantity) - Number(rows[0].quantity);
  }

  if (adjustmentDelta === 0) {
    const error = new Error("Adjustment delta cannot be zero (new quantity matches current quantity)");
    error.statusCode = 400;
    throw error;
  }

  const connection = await pool.getConnection();
  try {
    const [resultSets] = await connection.query("CALL sp_adjust_stock(?, ?, ?, ?)", [
      Number(productId),
      Number(userId),
      Number(adjustmentDelta),
      reason.trim(),
    ]);

    const operationResult = resultSets[0][0];
    return operationResult;
  } finally {
    connection.release();
  }
}

async function getProductMovements(productId, { page = 1, limit = 20 }) {
  const offset = (Number(page) - 1) * Number(limit);

  const [countResult] = await pool.query(
    "SELECT COUNT(*) as total FROM stock_movements WHERE product_id = ?",
    [productId]
  );
  const total = countResult[0].total;

  const [rows] = await pool.query(
    `SELECT sm.id AS movement_id, sm.product_id, p.sku, p.name AS product_name,
            sm.user_id, u.name AS performed_by, u.role AS user_role,
            sm.movement_type, sm.quantity, sm.quantity_before, sm.quantity_after,
            sm.note, sm.created_at
     FROM stock_movements sm
     JOIN products p ON p.id = sm.product_id
     JOIN users u ON u.id = sm.user_id
     WHERE sm.product_id = ?
     ORDER BY sm.created_at DESC, sm.id DESC
     LIMIT ? OFFSET ?`,
    [productId, Number(limit), Number(offset)]
  );

  return {
    movements: rows,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)) || 1,
    },
  };
}

async function getAllMovements({
  page = 1,
  limit = 20,
  product_id,
  user_id,
  movement_type,
  search,
  date_from,
  date_to,
}) {
  const offset = (Number(page) - 1) * Number(limit);
  const whereClauses = [];
  const params = [];

  if (product_id) {
    whereClauses.push("sm.product_id = ?");
    params.push(Number(product_id));
  }

  if (user_id) {
    whereClauses.push("sm.user_id = ?");
    params.push(Number(user_id));
  }

  if (movement_type) {
    whereClauses.push("sm.movement_type = ?");
    params.push(movement_type);
  }

  if (search) {
    whereClauses.push("(p.name LIKE ? OR p.sku LIKE ? OR sm.note LIKE ?)");
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (date_from) {
    whereClauses.push("sm.created_at >= ?");
    params.push(date_from);
  }

  if (date_to) {
    whereClauses.push("sm.created_at <= ?");
    params.push(date_to);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const [countResult] = await pool.query(
    `SELECT COUNT(*) as total
     FROM stock_movements sm
     JOIN products p ON p.id = sm.product_id
     JOIN users u ON u.id = sm.user_id
     ${whereSql}`,
    params
  );
  const total = countResult[0].total;

  const [rows] = await pool.query(
    `SELECT sm.id AS movement_id, sm.product_id, p.sku, p.name AS product_name,
            sm.user_id, u.name AS performed_by, u.role AS user_role,
            sm.movement_type, sm.quantity, sm.quantity_before, sm.quantity_after,
            sm.note, sm.created_at
     FROM stock_movements sm
     JOIN products p ON p.id = sm.product_id
     JOIN users u ON u.id = sm.user_id
     ${whereSql}
     ORDER BY sm.created_at DESC, sm.id DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );

  return {
    movements: rows,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)) || 1,
    },
  };
}

module.exports = {
  stockIn,
  stockOut,
  adjustStock,
  getProductMovements,
  getAllMovements,
};
