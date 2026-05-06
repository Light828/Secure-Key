-- Dev-only schema heal to keep order_location_history.order_id aligned with orders.id.
-- Safe to run repeatedly.

SET @tbl_exists = (
  SELECT COUNT(*)
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'order_location_history'
);

SET @col_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'order_location_history'
    AND COLUMN_NAME = 'order_id'
);

SET @fk_name = (
  SELECT kcu.CONSTRAINT_NAME
  FROM information_schema.KEY_COLUMN_USAGE kcu
  WHERE kcu.TABLE_SCHEMA = DATABASE()
    AND kcu.TABLE_NAME = 'order_location_history'
    AND kcu.COLUMN_NAME = 'order_id'
    AND kcu.REFERENCED_TABLE_NAME = 'orders'
  LIMIT 1
);

SET @drop_fk_sql = IF(
  @tbl_exists = 0 OR @col_exists = 0 OR @fk_name IS NULL,
  'SELECT 1',
  CONCAT('ALTER TABLE order_location_history DROP FOREIGN KEY ', @fk_name)
);
PREPARE stmt_drop_fk FROM @drop_fk_sql;
EXECUTE stmt_drop_fk;
DEALLOCATE PREPARE stmt_drop_fk;

SET @alter_col_sql = IF(
  @tbl_exists = 0 OR @col_exists = 0,
  'SELECT 1',
  'ALTER TABLE order_location_history MODIFY COLUMN order_id BIGINT UNSIGNED NOT NULL'
);
PREPARE stmt_alter_col FROM @alter_col_sql;
EXECUTE stmt_alter_col;
DEALLOCATE PREPARE stmt_alter_col;

SET @fk_exists = (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS tc
  WHERE tc.TABLE_SCHEMA = DATABASE()
    AND tc.TABLE_NAME = 'order_location_history'
    AND tc.CONSTRAINT_NAME = 'FKjxisdtu3t0y0ar7xxodn1ky37'
    AND tc.CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @add_fk_sql = IF(
  @tbl_exists = 0 OR @col_exists = 0 OR @fk_exists > 0,
  'SELECT 1',
  'ALTER TABLE order_location_history ADD CONSTRAINT FKjxisdtu3t0y0ar7xxodn1ky37 FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE'
);
PREPARE stmt_add_fk FROM @add_fk_sql;
EXECUTE stmt_add_fk;
DEALLOCATE PREPARE stmt_add_fk;
