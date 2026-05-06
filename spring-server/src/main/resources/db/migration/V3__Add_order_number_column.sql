-- Add order_number column to orders table
ALTER TABLE orders ADD COLUMN order_number VARCHAR(20) UNIQUE NOT NULL DEFAULT CONCAT('ORD-', LPAD(id, 6, '0'));

-- Create index for performance
CREATE INDEX idx_order_number ON orders(order_number);
