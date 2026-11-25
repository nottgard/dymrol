-- Contador global de golpes de la fragua, compartido por todos los usuarios.
-- Es una tabla de UNA sola fila: el CHECK sobre id impide crear más.

-- Up Migration
CREATE TABLE forge_counter (
  id      smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  smashes bigint   NOT NULL DEFAULT 0 CHECK (smashes >= 0)
);

-- Down Migration
DROP TABLE forge_counter;
