-- Add delivery/collect fields to orders table

ALTER TABLE orders 
ADD COLUMN delivery_type ENUM('collect', 'deliver') DEFAULT NULL,
ADD COLUMN delivery_address TEXT,
ADD COLUMN delivery_distance_km DECIMAL(5,2),
ADD COLUMN delivery_fee DECIMAL(8,2) DEFAULT 0.00,
ADD COLUMN collect_time DATETIME DEFAULT NULL;

-- Index
CREATE INDEX idx_delivery_type ON orders(delivery_type);

-- Run this on your DB to enable delivery options
-- UPDATE orders SET delivery_type = 'collect' WHERE id = [order_id]; for testing
