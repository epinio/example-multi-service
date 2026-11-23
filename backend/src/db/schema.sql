CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  roll_no TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  max_marks INTEGER NOT NULL DEFAULT 100
);

CREATE TABLE IF NOT EXISTS marks (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  term TEXT NOT NULL DEFAULT 'Final Term',
  marks_obtained INTEGER NOT NULL,
  UNIQUE (student_id, subject_id, term)
);

INSERT INTO subjects (name, max_marks) VALUES
  ('Mathematics', 100),
  ('Science', 100),
  ('English', 100),
  ('History', 100),
  ('Computer Science', 100)
ON CONFLICT (name) DO NOTHING;
