CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS threat_records (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    ip_decimal BIGINT NOT NULL, -- uint32_t, zakres [-2.1mld,2.1mld]
    threat_type VARCHAR(100) NOT NULL,
    country VARCHAR(100),
    city VARCHAR(100),
    latitude NUMERIC(10, 6),
    longitude NUMERIC(10, 6),
    -- Specjalna kolumna geograficzna (Punkt w formacie WGS84)
    geom geometry(Point, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX idx_threat_records_geom ON threat_records USING GIST (geom);

-- 4. Indeks na IP dla szybkich zapytań tekstowych
CREATE INDEX idx_threat_records_ip ON threat_records (ip_address);