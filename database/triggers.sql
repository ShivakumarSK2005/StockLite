-- StockLite triggers
USE stocklite;
DELIMITER $$

DROP TRIGGER IF EXISTS trg_stock_movements_before_update $$
CREATE TRIGGER trg_stock_movements_before_update
BEFORE UPDATE ON stock_movements
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Stock movement history is immutable; create a correcting adjustment instead';
END $$

DROP TRIGGER IF EXISTS trg_stock_movements_before_delete $$
CREATE TRIGGER trg_stock_movements_before_delete
BEFORE DELETE ON stock_movements
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Stock movement history cannot be deleted';
END $$

DELIMITER ;
