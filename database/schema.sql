-- StockLite database schema
-- Target: MySQL 8.0.16+ (enforced CHECK constraints), InnoDB, utf8mb4.
-- Run this file first.

CREATE DATABASE IF NOT EXISTS stocklite
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE stocklite;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(254) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'employee') NOT NULL DEFAULT 'employee',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_users_email UNIQUE (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS categories (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_categories_name UNIQUE (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS products (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    sku VARCHAR(64) NOT NULL,
    name VARCHAR(180) NOT NULL,
    category_id BIGINT UNSIGNED NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    quantity INT UNSIGNED NOT NULL DEFAULT 0,
    reorder_level INT UNSIGNED NOT NULL DEFAULT 5,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_products_sku UNIQUE (sku),
    CONSTRAINT chk_products_price_nonnegative CHECK (price >= 0),
    CONSTRAINT chk_products_reorder_nonnegative CHECK (reorder_level >= 0),
    CONSTRAINT fk_products_category
      FOREIGN KEY (category_id) REFERENCES categories(id)
      ON UPDATE RESTRICT ON DELETE RESTRICT,
    INDEX idx_products_category_active (category_id, is_active),
    INDEX idx_products_name (name),
    INDEX idx_products_stock_level (is_active, quantity, reorder_level)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS stock_movements (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    product_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    movement_type ENUM('stock_in', 'stock_out', 'adjustment_in', 'adjustment_out') NOT NULL,
    quantity INT UNSIGNED NOT NULL,
    quantity_before INT UNSIGNED NOT NULL,
    quantity_after INT UNSIGNED NOT NULL,
    note VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT chk_movements_quantity_positive CHECK (quantity > 0),
    CONSTRAINT fk_movements_product
      FOREIGN KEY (product_id) REFERENCES products(id)
      ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_movements_user
      FOREIGN KEY (user_id) REFERENCES users(id)
      ON UPDATE RESTRICT ON DELETE RESTRICT,
    INDEX idx_movements_product_created (product_id, created_at),
    INDEX idx_movements_user_created (user_id, created_at),
    INDEX idx_movements_type_created (movement_type, created_at),
    INDEX idx_movements_created (created_at)
) ENGINE=InnoDB;
