-- StockLite stored procedures
-- These procedures own their transaction. Call each procedure on a dedicated
-- pooled connection and do not wrap the CALL in another application transaction.

USE stocklite;
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_stock_in $$
CREATE PROCEDURE sp_stock_in(
    IN p_product_id BIGINT UNSIGNED,
    IN p_user_id BIGINT UNSIGNED,
    IN p_quantity INT UNSIGNED,
    IN p_note VARCHAR(500)
)
proc: BEGIN
    DECLARE v_before INT UNSIGNED DEFAULT NULL;
    DECLARE v_after INT UNSIGNED DEFAULT NULL;
    DECLARE v_found BOOLEAN DEFAULT TRUE;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF p_quantity IS NULL OR p_quantity = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Quantity must be greater than zero';
    END IF;

    START TRANSACTION;

    BEGIN
        DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_found = FALSE;
        SELECT quantity INTO v_before
        FROM products
        WHERE id = p_product_id AND is_active = TRUE
        FOR UPDATE;
    END;

    IF v_found = FALSE THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Active product not found';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id AND is_active = TRUE) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Active user not found';
    END IF;

    IF p_quantity > 2147483647 - v_before THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stock quantity limit would be exceeded';
    END IF;

    SET v_after = v_before + p_quantity;

    UPDATE products SET quantity = v_after WHERE id = p_product_id;

    INSERT INTO stock_movements
        (product_id, user_id, movement_type, quantity, quantity_before, quantity_after, note)
    VALUES
        (p_product_id, p_user_id, 'stock_in', p_quantity, v_before, v_after, p_note);

    COMMIT;

    SELECT p_product_id AS product_id, v_before AS quantity_before,
           v_after AS quantity_after, LAST_INSERT_ID() AS movement_id;
END $$

DROP PROCEDURE IF EXISTS sp_stock_out $$
CREATE PROCEDURE sp_stock_out(
    IN p_product_id BIGINT UNSIGNED,
    IN p_user_id BIGINT UNSIGNED,
    IN p_quantity INT UNSIGNED,
    IN p_note VARCHAR(500)
)
proc: BEGIN
    DECLARE v_before INT UNSIGNED DEFAULT NULL;
    DECLARE v_after INT UNSIGNED DEFAULT NULL;
    DECLARE v_found BOOLEAN DEFAULT TRUE;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF p_quantity IS NULL OR p_quantity = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Quantity must be greater than zero';
    END IF;

    START TRANSACTION;

    BEGIN
        DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_found = FALSE;
        SELECT quantity INTO v_before
        FROM products
        WHERE id = p_product_id AND is_active = TRUE
        FOR UPDATE;
    END;

    IF v_found = FALSE THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Active product not found';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id AND is_active = TRUE) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Active user not found';
    END IF;

    IF v_before < p_quantity THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient stock';
    END IF;

    SET v_after = v_before - p_quantity;

    UPDATE products SET quantity = v_after WHERE id = p_product_id;

    INSERT INTO stock_movements
        (product_id, user_id, movement_type, quantity, quantity_before, quantity_after, note)
    VALUES
        (p_product_id, p_user_id, 'stock_out', p_quantity, v_before, v_after, p_note);

    COMMIT;

    SELECT p_product_id AS product_id, v_before AS quantity_before,
           v_after AS quantity_after, LAST_INSERT_ID() AS movement_id;
END $$

-- A deliberate correction operation. Require an explicit reason in the note.
-- Positive delta increases stock; negative delta decreases stock.
DROP PROCEDURE IF EXISTS sp_adjust_stock $$
CREATE PROCEDURE sp_adjust_stock(
    IN p_product_id BIGINT UNSIGNED,
    IN p_user_id BIGINT UNSIGNED,
    IN p_delta INT,
    IN p_note VARCHAR(500)
)
proc: BEGIN
    DECLARE v_before INT UNSIGNED DEFAULT NULL;
    DECLARE v_after INT UNSIGNED DEFAULT NULL;
    DECLARE v_abs_delta INT UNSIGNED DEFAULT NULL;
    DECLARE v_type VARCHAR(20);
    DECLARE v_found BOOLEAN DEFAULT TRUE;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF p_delta IS NULL OR p_delta = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Adjustment delta cannot be zero';
    END IF;
    IF p_note IS NULL OR CHAR_LENGTH(TRIM(p_note)) = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Adjustment reason is required';
    END IF;

    START TRANSACTION;

    BEGIN
        DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_found = FALSE;
        SELECT quantity INTO v_before
        FROM products
        WHERE id = p_product_id AND is_active = TRUE
        FOR UPDATE;
    END;

    IF v_found = FALSE THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Active product not found';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id AND is_active = TRUE) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Active user not found';
    END IF;

    IF p_delta > 0 THEN
        SET v_abs_delta = p_delta;
        IF v_abs_delta > 2147483647 - v_before THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stock quantity limit would be exceeded';
        END IF;
        SET v_after = v_before + v_abs_delta;
        SET v_type = 'adjustment_in';
    ELSE
        SET v_abs_delta = ABS(p_delta);
        IF v_abs_delta > v_before THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Adjustment would make stock negative';
        END IF;
        SET v_after = v_before - v_abs_delta;
        SET v_type = 'adjustment_out';
    END IF;

    UPDATE products SET quantity = v_after WHERE id = p_product_id;

    INSERT INTO stock_movements
        (product_id, user_id, movement_type, quantity, quantity_before, quantity_after, note)
    VALUES
        (p_product_id, p_user_id, v_type, v_abs_delta, v_before, v_after, p_note);

    COMMIT;

    SELECT p_product_id AS product_id, v_before AS quantity_before,
           v_after AS quantity_after, LAST_INSERT_ID() AS movement_id;
END $$

DELIMITER ;
