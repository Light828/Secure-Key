-- =====================================================================
-- COMPLETE DATABASE SCHEMA FOR SECUREKEY LOCKSMITH PLATFORM
-- Fresh schema for securekey_locksmith_db
-- =====================================================================

CREATE DATABASE IF NOT EXISTS securekey_locksmith_db;
USE securekey_locksmith_db;

DROP VIEW IF EXISTS order_payment_history;
DROP VIEW IF EXISTS user_order_summary;
DROP VIEW IF EXISTS payment_statistics;
DROP TRIGGER IF EXISTS after_order_pending_insert;

DROP TABLE IF EXISTS order_location_history;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS email_verifications;
DROP TABLE IF EXISTS password_resets;
DROP TABLE IF EXISTS enquiries;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;

-- =====================================================================
-- 1. USERS TABLE
-- =====================================================================
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('client', 'admin') NOT NULL DEFAULT 'client',
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 2. PRODUCTS TABLE
-- =====================================================================
CREATE TABLE products (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  description LONGTEXT,
  price DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  image_url VARCHAR(500),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active (is_active),
  INDEX idx_created (created_at),
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 3. CART ITEMS TABLE
-- =====================================================================
CREATE TABLE cart_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_product (user_id, product_id),
  INDEX idx_user_id (user_id),
  INDEX idx_product_id (product_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 4. ORDERS TABLE
-- =====================================================================
CREATE TABLE orders (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  paypal_order_id VARCHAR(80) UNIQUE,
  paypal_capture_id VARCHAR(80),
  total DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'ZAR',
  payment_status ENUM('pending', 'paid', 'failed') NOT NULL DEFAULT 'pending',
  processing_status VARCHAR(50) NOT NULL DEFAULT 'awaiting_payment',
  location_note VARCHAR(255),
  delivery_type ENUM('collect', 'deliver') DEFAULT 'collect',
  delivery_address TEXT,
  delivery_distance_km DECIMAL(5,2),
  delivery_fee DECIMAL(8,2) DEFAULT 0.00,
  collect_time DATETIME,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_payment_status (payment_status),
  INDEX idx_processing_status (processing_status),
  INDEX idx_delivery_type (delivery_type),
  INDEX idx_created (created_at),
  INDEX idx_paypal_order (paypal_order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 5. ORDER ITEMS TABLE
-- =====================================================================
CREATE TABLE order_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  product_name VARCHAR(180) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_order_id (order_id),
  INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 6. ORDER LOCATION HISTORY TABLE
-- =====================================================================
CREATE TABLE order_location_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  admin_name VARCHAR(120) NOT NULL,
  processing_status VARCHAR(40) NOT NULL,
  location_note VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order_id (order_id),
  INDEX idx_status (processing_status),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 7. PAYMENTS TABLE
-- =====================================================================
CREATE TABLE payments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT,
  stripe_session_id VARCHAR(255) UNIQUE,
  stripe_payment_intent_id VARCHAR(255),
  amount BIGINT NOT NULL COMMENT 'Amount in cents (e.g., 10000 = R100.00)',
  currency VARCHAR(3) DEFAULT 'ZAR',
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  metadata JSON COMMENT 'Additional Stripe metadata',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  INDEX idx_order_id (order_id),
  INDEX idx_session (stripe_session_id),
  INDEX idx_status (status),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 8. EMAIL VERIFICATIONS TABLE
-- =====================================================================
CREATE TABLE email_verifications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_token (token),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 9. PASSWORD RESETS TABLE
-- =====================================================================
CREATE TABLE password_resets (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  code VARCHAR(6) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_code (code),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 10. ENQUIRIES TABLE
-- =====================================================================
CREATE TABLE enquiries (
  id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  service TEXT NOT NULL,
  message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'resolved')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- TRIGGER: AUTO-CREATE PAYMENT RECORD
-- =====================================================================
DELIMITER //

CREATE TRIGGER after_order_pending_insert
AFTER INSERT ON orders
FOR EACH ROW
BEGIN
  IF NEW.payment_status = 'pending' THEN
    INSERT INTO payments (order_id, amount, currency, status, created_at)
    VALUES (NEW.id, (NEW.total * 100), NEW.currency, 'pending', NOW());
  END IF;
END//

DELIMITER ;

-- =====================================================================
-- VIEWS FOR PAYMENT & ORDER HISTORY
-- =====================================================================
CREATE VIEW order_payment_history AS
SELECT 
  o.id,
  o.user_id,
  o.total,
  o.currency,
  o.payment_status,
  o.processing_status,
  o.delivery_type,
  o.delivery_address,
  o.delivery_fee,
  o.delivery_distance_km,
  p.id AS payment_id,
  p.stripe_session_id,
  p.stripe_payment_intent_id,
  ROUND(p.amount / 100, 2) AS payment_amount,
  p.status AS payment_status_stripe,
  p.created_at AS payment_created,
  p.updated_at AS payment_updated,
  o.created_at AS order_created,
  o.updated_at AS order_updated,
  (SELECT GROUP_CONCAT(CONCAT(oi.product_name, ' x', oi.quantity) SEPARATOR ', ')
   FROM order_items oi WHERE oi.order_id = o.id) AS items_summary,
  (SELECT COUNT(*) FROM order_location_history olh WHERE olh.order_id = o.id) AS status_updates_count
FROM orders o
LEFT JOIN payments p ON o.id = p.order_id
ORDER BY o.created_at DESC;

CREATE VIEW user_order_summary AS
SELECT 
  u.id AS user_id,
  u.name,
  u.email,
  COUNT(DISTINCT o.id) AS total_orders,
  COALESCE(SUM(o.total), 0) AS total_spent,
  COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total ELSE 0 END), 0) AS completed_amount,
  COALESCE(SUM(CASE WHEN o.payment_status = 'pending' THEN o.total ELSE 0 END), 0) AS pending_amount,
  MAX(o.created_at) AS last_order_date
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.name, u.email;

CREATE VIEW payment_statistics AS
SELECT 
  DATE(p.created_at) AS payment_date,
  COUNT(*) AS total_transactions,
  SUM(p.amount) AS total_amount_cents,
  ROUND(SUM(p.amount) / 100, 2) AS total_amount_rands,
  SUM(CASE WHEN p.status = 'paid' THEN 1 ELSE 0 END) AS completed_count,
  SUM(CASE WHEN p.status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
  SUM(CASE WHEN p.status = 'failed' THEN 1 ELSE 0 END) AS failed_count,
  SUM(CASE WHEN p.status = 'refunded' THEN 1 ELSE 0 END) AS refunded_count
FROM payments p
WHERE p.created_at IS NOT NULL
GROUP BY DATE(p.created_at)
ORDER BY payment_date DESC;

-- =====================================================================
-- DATABASE SETUP COMPLETE
-- =====================================================================
-- Run this script with: mysql -u root -p < complete-database-setup.sql
-- =====================================================================
