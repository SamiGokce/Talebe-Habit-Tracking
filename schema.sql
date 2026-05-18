-- Talebe Tracker schema
-- Run this once against your Vercel Postgres / Neon DB.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  school_level TEXT NOT NULL DEFAULT 'middle_school',
  mentor_name TEXT,
  leader_passphrase_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE groups ADD COLUMN IF NOT EXISTS school_level TEXT NOT NULL DEFAULT 'middle_school';
ALTER TABLE groups ADD COLUMN IF NOT EXISTS mentor_name TEXT;

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  school_level TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (group_id, display_name)
);

ALTER TABLE students ADD COLUMN IF NOT EXISTS school_level TEXT;

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
  cevsen BOOLEAN NOT NULL DEFAULT FALSE,
  quran_pages INTEGER NOT NULL DEFAULT 0,
  zikr_count INTEGER NOT NULL DEFAULT 0,
  book_pages INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, entry_date)
);

ALTER TABLE entries ADD COLUMN IF NOT EXISTS cevsen BOOLEAN NOT NULL DEFAULT FALSE;

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

CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  kind TEXT NOT NULL DEFAULT 'boolean',
  unit TEXT,
  created_by_role TEXT NOT NULL DEFAULT 'mentor',
  points INTEGER NOT NULL DEFAULT 1,
  starts_on DATE,
  ends_on DATE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (kind IN ('boolean', 'count')),
  CHECK (created_by_role IN ('talebe', 'mentor', 'uniteci')),
  CHECK (points >= 0 AND points <= 999)
);

CREATE INDEX IF NOT EXISTS goals_group_idx ON goals(group_id);
CREATE INDEX IF NOT EXISTS goals_student_idx ON goals(student_id);

CREATE TABLE IF NOT EXISTS goal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  amount INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (goal_id, student_id, entry_date)
);

CREATE INDEX IF NOT EXISTS goal_entries_student_date_idx
  ON goal_entries(student_id, entry_date DESC);
