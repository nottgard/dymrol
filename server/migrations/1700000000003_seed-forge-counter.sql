-- Fila inicial del contador (valor 0).

-- Up Migration
INSERT INTO forge_counter (id, smashes) VALUES (1, 0);

-- Down Migration
DELETE FROM forge_counter WHERE id = 1;
