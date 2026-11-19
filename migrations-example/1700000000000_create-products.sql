-- EJEMPLO de migración de ESQUEMA.
-- Todo lo que hay bajo "Up Migration" se ejecuta con `pnpm migrate`.
-- Todo lo que hay bajo "Down Migration" se ejecuta con `pnpm migrate:down`
-- y debe dejar la base de datos exactamente como estaba antes del Up.

-- Up Migration
CREATE TABLE products (
  id          serial PRIMARY KEY,
  name        text NOT NULL,
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX products_name_idx ON products (name);

-- Down Migration
-- Se deshace en orden inverso al de creación.
DROP INDEX products_name_idx;
DROP TABLE products;
