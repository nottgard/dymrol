-- Salt diario usado para anonimizar IP + User-Agent al registrar visitas.
-- Tabla de UNA sola fila (CHECK sobre id): nunca se conserva el salt anterior,
-- así los hashes de días distintos no se pueden correlacionar.

-- Up Migration
CREATE TABLE salt_key (
  id        smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  salt      text     NOT NULL,
  salt_date date     NOT NULL
);

-- Down Migration
DROP TABLE salt_key;
