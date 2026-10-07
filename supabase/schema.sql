-- ============================================================
-- LetSplit — Carpool Expense Splitter
-- Database Schema, RLS Policies & Seed Data
-- ============================================================
-- Run this SQL in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- =========================
-- 1. TABLES
-- =========================

-- People in the carpool group
CREATE TABLE IF NOT EXISTS people (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Case-insensitive uniqueness
  CONSTRAINT people_name_unique UNIQUE (name)
);

-- Create a unique index on lowercased name for case-insensitive duplicate prevention
CREATE UNIQUE INDEX IF NOT EXISTS people_name_lower_idx ON people (LOWER(name));

-- Trip records
CREATE TABLE IF NOT EXISTS trips (
  id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  trip_date             DATE NOT NULL,
  trip_type             TEXT NOT NULL CHECK (trip_type IN ('morning', 'evening')),
  total_amount_paise    INTEGER NOT NULL CHECK (total_amount_paise > 0),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Only one trip per date + type
  CONSTRAINT trips_date_type_unique UNIQUE (trip_date, trip_type)
);

-- Trip participants (many-to-many between trips and people)
CREATE TABLE IF NOT EXISTS trip_participants (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  trip_id       BIGINT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  person_id     BIGINT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  amount_paise  INTEGER NOT NULL CHECK (amount_paise >= 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- A person can only appear once per trip
  CONSTRAINT trip_participants_unique UNIQUE (trip_id, person_id)
);

-- Application settings (key-value store)
CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================
-- 2. INDEXES
-- =========================

CREATE INDEX IF NOT EXISTS trips_date_idx ON trips (trip_date DESC);
CREATE INDEX IF NOT EXISTS trips_date_type_idx ON trips (trip_date, trip_type);
CREATE INDEX IF NOT EXISTS trip_participants_trip_idx ON trip_participants (trip_id);
CREATE INDEX IF NOT EXISTS trip_participants_person_idx ON trip_participants (person_id);

-- =========================
-- 3. ROW LEVEL SECURITY
-- =========================

-- Enable RLS on all tables
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- ---- people ----
-- Anyone can read
CREATE POLICY "people_select_public" ON people
  FOR SELECT USING (true);

-- Only authenticated users can insert
CREATE POLICY "people_insert_auth" ON people
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated users can update
CREATE POLICY "people_update_auth" ON people
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated users can delete
CREATE POLICY "people_delete_auth" ON people
  FOR DELETE USING (auth.role() = 'authenticated');

-- ---- trips ----
CREATE POLICY "trips_select_public" ON trips
  FOR SELECT USING (true);

CREATE POLICY "trips_insert_auth" ON trips
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "trips_update_auth" ON trips
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "trips_delete_auth" ON trips
  FOR DELETE USING (auth.role() = 'authenticated');

-- ---- trip_participants ----
CREATE POLICY "trip_participants_select_public" ON trip_participants
  FOR SELECT USING (true);

CREATE POLICY "trip_participants_insert_auth" ON trip_participants
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "trip_participants_update_auth" ON trip_participants
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "trip_participants_delete_auth" ON trip_participants
  FOR DELETE USING (auth.role() = 'authenticated');

-- ---- settings ----
CREATE POLICY "settings_select_public" ON settings
  FOR SELECT USING (true);

CREATE POLICY "settings_insert_auth" ON settings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "settings_update_auth" ON settings
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- =========================
-- 4. SEED DATA
-- =========================

-- Initial people
INSERT INTO people (name) VALUES
  ('Om'),
  ('Vinit'),
  ('Rikin'),
  ('Shivang'),
  ('Kaushal')
ON CONFLICT (name) DO NOTHING;

-- Default settings
INSERT INTO settings (key, value) VALUES
  ('default_trip_price_paise', '22500'),
  ('driver_person_id', '1')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
