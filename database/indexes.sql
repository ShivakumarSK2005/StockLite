-- Additional indexes only; the core indexes are already defined in schema.sql.
-- Run only if you want these optional query-specific indexes.
USE stocklite;

CREATE INDEX idx_products_active_name_id
    ON products (is_active, name, id);

CREATE INDEX idx_movements_product_type_created
    ON stock_movements (product_id, movement_type, created_at);
