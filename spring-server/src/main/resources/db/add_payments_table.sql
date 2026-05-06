-- Add payments table for Stripe tracking

CREATE TABLE IF NOT EXISTS payments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  stripe_session_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  amount BIGINT NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order_id (order_id),
  INDEX idx_session_id (stripe_session_id),
  INDEX idx_status (status)
);

-- Migrate existing orders (if needed, manual stripe IDs)
-- INSERT INTO payments (order_id, stripe_session_id, amount, currency, status) VALUES (...);
