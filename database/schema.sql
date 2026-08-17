PRAGMA foreign_keys = ON;

-- Areas in Bengaluru
CREATE TABLE IF NOT EXISTS areas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    city TEXT NOT NULL DEFAULT 'Bengaluru'
);

-- Masjids
CREATE TABLE IF NOT EXISTS masjids (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    area_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    address TEXT,
    latitude REAL,
    longitude REAL,
    phone TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (area_id)
        REFERENCES areas(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- Prayer timings
CREATE TABLE IF NOT EXISTS prayer_timings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    masjid_id INTEGER NOT NULL,
    fajr TEXT,
    dhuhr TEXT,
    asr TEXT,
    maghrib TEXT,
    isha TEXT,
    jumuah TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (masjid_id)
        REFERENCES masjids(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- Useful indexes for searches
CREATE INDEX IF NOT EXISTS idx_masjids_area_id
    ON masjids(area_id);

CREATE INDEX IF NOT EXISTS idx_masjids_name
    ON masjids(name);

CREATE INDEX IF NOT EXISTS idx_masjids_slug
    ON masjids(slug);

CREATE INDEX IF NOT EXISTS idx_prayer_timings_masjid_id
    ON prayer_timings(masjid_id);
