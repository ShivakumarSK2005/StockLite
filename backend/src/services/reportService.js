const pool = require("../config/db");

async function getDashboardSummary() {
  const [summaryRows] = await pool.query("SELECT * FROM vw_dashboard_summary");
  const summary = summaryRows[0] || {
    total_products: 0,
    total_categories: 0,
    low_stock_products: 0,
    total_inventory_value: 0,
  };

  // Recent 10 movements
  const [recentMovements] = await pool.query(
    "SELECT * FROM vw_recent_stock_movements ORDER BY created_at DESC LIMIT 10"
  );

  // Top categories by inventory value & product count
  const [categoryBreakdown] = await pool.query(
    `SELECT c.id, c.name, COUNT(p.id) AS product_count,
            COALESCE(SUM(p.price * p.quantity), 0) AS total_value
     FROM categories c
     LEFT JOIN products p ON p.category_id = c.id AND p.is_active = TRUE
     GROUP BY c.id
     ORDER BY total_value DESC`
  );

  return {
    summary: {
      total_products: Number(summary.total_products),
      total_categories: Number(summary.total_categories),
      low_stock_products: Number(summary.low_stock_products),
      total_inventory_value: Number(summary.total_inventory_value),
    },
    recentMovements,
    categoryBreakdown,
  };
}

async function getLowStockProducts({ page = 1, limit = 20 }) {
  const offset = (Number(page) - 1) * Number(limit);

  const [countResult] = await pool.query(
    "SELECT COUNT(*) as total FROM vw_low_stock_products"
  );
  const total = countResult[0].total;

  const [rows] = await pool.query(
    `SELECT * FROM vw_low_stock_products
     ORDER BY quantity ASC, product_name ASC
     LIMIT ? OFFSET ?`,
    [Number(limit), Number(offset)]
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

async function getInventoryExport() {
  const [rows] = await pool.query(
    "SELECT * FROM vw_inventory ORDER BY category_name ASC, product_name ASC"
  );
  return rows;
}

module.exports = {
  getDashboardSummary,
  getLowStockProducts,
  getInventoryExport,
};
