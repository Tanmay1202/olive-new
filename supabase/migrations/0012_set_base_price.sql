-- 0012_set_base_price.sql
UPDATE room_types 
SET base_price = 5000.00
WHERE name = 'Standard Room';
