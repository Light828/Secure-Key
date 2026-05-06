-- Complete Stripe order flow: payments table + triggers for audit

CREATE TABLE IF NOT EXISTS payments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED,
  stripe_session_id VARCHAR(255) UNIQUE,
  stripe_payment_intent_id VARCHAR(255),
  amount BIGINT NOT NULL,
  currency VARCHAR(3) DEFAULT 'ZAR',
  status VARCHAR(50) DEFAULT 'pending',
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  INDEX idx_session (stripe_session_id),
  INDEX idx_status (status)
);

-- Trigger: On new order with pending payment, create payments record
DELIMITER //
CREATE TRIGGER after_order_pending_insert
AFTER INSERT ON orders
FOR EACH ROW
BEGIN
  IF NEW.payment_status = 'pending' THEN
    INSERT INTO payments (order_id, stripe_session_id, amount, currency, status) 
    VALUES (NEW.id, CONCAT('sess_', NEW.id), (NEW.total * 100)::BIGINT, NEW.currency, 'pending');
  END IF;
END//
DELIMITER ;

-- Function for backend to update payment status after webhook/confirm
-- Call from OrderController: UPDATE payments SET status='paid' WHERE stripe_session_id=?

-- Run: mysql -u root -p locksmith_db < db/add_stripe_order_flow.sql
-- Backend will write to DB on /api/orders/confirm-stripe-payment
