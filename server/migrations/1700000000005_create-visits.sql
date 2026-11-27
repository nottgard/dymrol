-- Registro de visitas anónimo. visitor_hash = HMAC-SHA256(salt diario, ip + user-agent).
-- Visitas totales = COUNT(*); visitas únicas = COUNT(DISTINCT visitor_hash), por día y/o página.

-- Up Migration
CREATE TABLE visits (
  id           bigserial PRIMARY KEY,
  visitor_hash char(64)     NOT NULL,
  visit_date   date         NOT NULL,
  page         varchar(255) NOT NULL
);

CREATE INDEX visits_date_page_idx ON visits (visit_date, page);
CREATE INDEX visits_date_visitor_idx ON visits (visit_date, visitor_hash);

-- Down Migration
DROP TABLE visits;
