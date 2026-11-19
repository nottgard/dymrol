-- EJEMPLO de migración de DATOS (seed).
-- Va en un fichero aparte del esquema. El Down borra exactamente lo que
-- insertó el Up, sin tocar otras filas que pueda haber creado la aplicación.

-- Up Migration
INSERT INTO products (name, price_cents) VALUES
  ('Camiseta', 1999),
  ('Taza', 899);

-- Down Migration
DELETE FROM products WHERE name IN ('Camiseta', 'Taza');
