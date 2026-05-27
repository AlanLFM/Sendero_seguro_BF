-- ============================================================
--  sendero_seguro — schema inicial
--  Requiere: PostgreSQL 15+ con extensión PostGIS 3+
--  Ejecutar: psql -d sendero_seguro -f bd.sql
-- ============================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- USUARIOS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  boleta          TEXT NOT NULL UNIQUE,
  nombre_completo TEXT NOT NULL,
  correo          TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  avatar_url      TEXT,
  role            TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_boleta ON users(boleta);
CREATE INDEX idx_users_correo  ON users(correo);

-- ============================================================
-- CONTACTOS DE APOYO
-- ============================================================
CREATE TABLE IF NOT EXISTS support_contacts (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nombre     TEXT NOT NULL,
  telefono   TEXT NOT NULL,
  email      TEXT,
  relacion   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_support_contacts_user ON support_contacts(user_id);

-- ============================================================
-- REFRESH TOKENS (sesiones por dispositivo)
-- ============================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  device_info TEXT,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

-- ============================================================
-- REPORTES COMUNITARIOS (geometría POINT)
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  titulo        TEXT NOT NULL,
  descripcion   TEXT,
  categoria     TEXT NOT NULL CHECK (categoria IN (
                  'robo', 'acoso', 'persona_sospechosa',
                  'infraestructura', 'emergencia_medica',
                  'violencia_agresion', 'accidente',
                  'objeto_sospechoso', 'riesgo_ambiental',
                  'transporte_movilidad', 'seguridad_preventiva', 'otro'
                )),
  geom          GEOMETRY(POINT, 4326) NOT NULL,
  ubicacion_txt TEXT,
  es_anonimo    BOOLEAN NOT NULL DEFAULT FALSE,
  evidencia_url TEXT,
  estado        TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'verificado', 'resuelto', 'rechazado')),
  utiles        INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_geom     ON reports USING GIST(geom);
CREATE INDEX idx_reports_categoria ON reports(categoria);
CREATE INDEX idx_reports_estado    ON reports(estado);
CREATE INDEX idx_reports_user      ON reports(user_id);
CREATE INDEX idx_reports_created   ON reports(created_at DESC);

-- ============================================================
-- ALERTAS DE EMERGENCIA (geometría POINT)
-- ============================================================
CREATE TABLE IF NOT EXISTS emergency_alerts (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  titulo     TEXT NOT NULL,
  geom       GEOMETRY(POINT, 4326) NOT NULL,
  estado     TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'en_proceso', 'resuelta')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emergency_geom   ON emergency_alerts USING GIST(geom);
CREATE INDEX idx_emergency_estado ON emergency_alerts(estado);
CREATE INDEX idx_emergency_user   ON emergency_alerts(user_id);
CREATE INDEX idx_emergency_created ON emergency_alerts(created_at DESC);

-- ============================================================
-- RUTAS / SENDEROS (geometría LINESTRING)
-- ============================================================
CREATE TABLE IF NOT EXISTS routes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  description   TEXT,
  geom          GEOMETRY(LINESTRING, 4326) NOT NULL,
  distance_m    NUMERIC GENERATED ALWAYS AS (ST_Length(geom::geography)) STORED,
  risk_level    TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_routes_geom ON routes USING GIST(geom);
CREATE INDEX idx_routes_risk ON routes(risk_level);

-- ============================================================
-- ZONAS DE RIESGO (geometría POLYGON)
-- ============================================================
CREATE TABLE IF NOT EXISTS zones (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  description   TEXT,
  geom          GEOMETRY(POLYGON, 4326) NOT NULL,
  risk_level    TEXT NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  color         TEXT DEFAULT '#FF0000',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_zones_geom ON zones USING GIST(geom);

-- ============================================================
-- FUNCIÓN: actualizar updated_at automáticamente
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_support_contacts_updated_at
  BEFORE UPDATE ON support_contacts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_emergency_alerts_updated_at
  BEFORE UPDATE ON emergency_alerts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_routes_updated_at
  BEFORE UPDATE ON routes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_zones_updated_at
  BEFORE UPDATE ON zones
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- VISTA: reportes con coordenadas separadas (útil para APIs)
-- ============================================================
CREATE OR REPLACE VIEW reports_with_coords AS
SELECT
  r.*,
  ST_Y(r.geom) AS latitude,
  ST_X(r.geom) AS longitude
FROM reports r;

-- ============================================================
-- VISTA: alertas de emergencia con coordenadas separadas
-- ============================================================
CREATE OR REPLACE VIEW emergency_alerts_with_coords AS
SELECT
  e.*,
  ST_Y(e.geom) AS latitude,
  ST_X(e.geom) AS longitude
FROM emergency_alerts e;

-- ============================================================
-- VISTA: rutas con riesgo heredado de zonas que intersectan
-- ============================================================
CREATE OR REPLACE VIEW routes_with_risk AS
SELECT
  r.id,
  r.name,
  r.description,
  r.distance_m,
  r.risk_level AS route_risk,
  COALESCE(MAX(z.risk_level), 'low') AS zone_risk,
  r.is_active,
  r.created_at
FROM routes r
LEFT JOIN zones z ON ST_Intersects(r.geom, z.geom) AND z.is_active = TRUE
WHERE r.is_active = TRUE
GROUP BY r.id;
