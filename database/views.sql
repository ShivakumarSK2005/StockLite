-- StockLite reporting views
USE stocklite;

CREATE OR REPLACE VIEW vw_inventory AS
SELECT
    p.id AS product_id,
    p.sku,
    p.name AS product_name,
    c.id AS category_id,
    c.name AS category_name,
    p.price,
    p.quantity,
    p.reorder_level,
    CAST(p.price * p.quantity AS DECIMAL(18,2)) AS inventory_value,
    CASE
      WHEN p.quantity = 0 THEN 'out_of_stock'
      WHEN p.quantity <= p.reorder_level THEN 'low_stock'
      ELSE 'in_stock'
    END AS stock_status,
    p.created_at,
    p.updated_at
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE p.is_active = TRUE;

CREATE OR REPLACE VIEW vw_low_stock_products AS
SELECT *
FROM vw_inventory
WHERE quantity <= reorder_level;

CREATE OR REPLACE VIEW vw_recent_stock_movements AS
SELECT
    sm.id AS movement_id,
    sm.product_id,
    p.sku,
    p.name AS product_name,
    sm.user_id,
    u.name AS performed_by,
    sm.movement_type,
    sm.quantity,
    sm.quantity_before,
    sm.quantity_after,
    sm.note,
    sm.created_at
FROM stock_movements sm
JOIN products p ON p.id = sm.product_id
JOIN users u ON u.id = sm.user_id;

CREATE OR REPLACE VIEW vw_dashboard_summary AS
SELECT
    (SELECT COUNT(*) FROM products WHERE is_active = TRUE) AS total_products,
    (SELECT COUNT(*) FROM categories) AS total_categories,
    (SELECT COUNT(*) FROM products
      WHERE is_active = TRUE AND quantity <= reorder_level) AS low_stock_products,
    (SELECT COALESCE(SUM(price * quantity), 0)
      FROM products WHERE is_active = TRUE) AS total_inventory_value;
