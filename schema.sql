-- Talebe Tracker schema
-- Run this once against your Vercel Postgres / Neon DB.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  leader_passphrase_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (group_id, display_name)
);

CREATE INDEX IF NOT EXISTS students_group_idx ON students(group_id);

CREATE TABLE IF NOT EXISTS entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  fajr BOOLEAN NOT NULL DEFAULT TRUE,
  fajr_cemaat BOOLEAN NOT NULL DEFAULT FALSE,
  dhuhr BOOLEAN NOT NULL DEFAULT TRUE,
  dhuhr_cemaat BOOLEAN NOT NULL DEFAULT FALSE,
  asr BOOLEAN NOT NULL DEFAULT TRUE,
  asr_cemaat BOOLEAN NOT NULL DEFAULT FALSE,
  maghrib BOOLEAN NOT NULL DEFAULT TRUE,
  maghrib_cemaat BOOLEAN NOT NULL DEFAULT FALSE,
  isha BOOLEAN NOT NULL DEFAULT TRUE,
  isha_cemaat BOOLEAN NOT NULL DEFAULT FALSE,
  tahajjud BOOLEAN NOT NULL DEFAULT FALSE,
  duha BOOLEAN NOT NULL DEFAULT FALSE,
  evvabin BOOLEAN NOT NULL DEFAULT FALSE,
  quran_pages INTEGER NOT NULL DEFAULT 0,
  zikr_count INTEGER NOT NULL DEFAULT 0,
  book_pages INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, entry_date)
);

CREATE INDEX IF NOT EXISTS entries_student_date_idx ON entries(student_id, entry_date DESC);

CREATE TABLE IF NOT EXISTS contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  scoring JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS contests_group_idx ON contests(group_id);
