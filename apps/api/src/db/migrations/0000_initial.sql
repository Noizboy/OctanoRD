CREATE EXTENSION IF NOT EXISTS postgis;

-- Nota: Las tablas las crea Drizzle Kit.
-- Este archivo agrega lo que Drizzle no puede generar:

-- Columna geom en gas_stations (se ejecuta despues de que Drizzle cree la tabla)
ALTER TABLE gas_stations ADD COLUMN IF NOT EXISTS geom GEOMETRY(Point, 4326);
CREATE INDEX IF NOT EXISTS idx_gas_stations_geom ON gas_stations USING GIST(geom);

-- Trigger: sincronizar geom desde lat/lng
CREATE OR REPLACE FUNCTION sync_station_geom()
RETURNS TRIGGER AS $$
BEGIN
  NEW.geom = ST_SetSRID(ST_MakePoint(NEW.lng::float, NEW.lat::float), 4326);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_geom ON gas_stations;
CREATE TRIGGER trg_sync_geom
  BEFORE INSERT OR UPDATE OF lat, lng ON gas_stations
  FOR EACH ROW EXECUTE FUNCTION sync_station_geom();

-- Trigger: recalcular avg_rating cuando cambia el status de una review
CREATE OR REPLACE FUNCTION recalculate_station_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE gas_stations SET
    avg_rating = (
      SELECT ROUND(AVG(stars)::NUMERIC, 1)
      FROM reviews WHERE station_id = NEW.station_id AND status = 'approved'
    ),
    review_count = (
      SELECT COUNT(*) FROM reviews
      WHERE station_id = NEW.station_id AND status = 'approved'
    ),
    updated_at = NOW()
  WHERE id = NEW.station_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recalculate_rating ON reviews;
CREATE TRIGGER trg_recalculate_rating
  AFTER INSERT OR UPDATE OF status ON reviews
  FOR EACH ROW EXECUTE FUNCTION recalculate_station_rating();
