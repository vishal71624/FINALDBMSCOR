-- First, add missing student columns to players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS college VARCHAR(255);
ALTER TABLE players ADD COLUMN IF NOT EXISTS department VARCHAR(255);
ALTER TABLE players ADD COLUMN IF NOT EXISTS year_of_study VARCHAR(50);
ALTER TABLE players ADD COLUMN IF NOT EXISTS contact_number VARCHAR(20);
ALTER TABLE players ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Drop unused tables if they exist
DROP TABLE IF EXISTS student_performance CASCADE;
DROP TABLE IF EXISTS students CASCADE;

-- Create round1_questions table
CREATE TABLE IF NOT EXISTS round1_questions (
  id SERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL DEFAULT 'mcq' CHECK (type IN ('mcq', 'scenario')),
  difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question TEXT NOT NULL,
  scenario TEXT,
  options JSONB NOT NULL DEFAULT '[]',
  correct_answer INTEGER NOT NULL,
  points INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create round2_challenges table
CREATE TABLE IF NOT EXISTS round2_challenges (
  id SERIAL PRIMARY KEY,
  difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  scenario TEXT,
  schema TEXT,
  base_table_data JSONB NOT NULL DEFAULT '[]',
  test_cases JSONB NOT NULL DEFAULT '[]',
  expected_keywords JSONB DEFAULT '[]',
  total_points INTEGER NOT NULL DEFAULT 15,
  time_limit INTEGER NOT NULL DEFAULT 180,
  correct_query TEXT,  -- The correct SQL query to generate expected output dynamically
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_round1_questions_difficulty ON round1_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_round1_questions_active ON round1_questions(is_active);
CREATE INDEX IF NOT EXISTS idx_round2_challenges_difficulty ON round2_challenges(difficulty);
CREATE INDEX IF NOT EXISTS idx_round2_challenges_active ON round2_challenges(is_active);

-- Enable RLS
ALTER TABLE round1_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE round2_challenges ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to round1_questions" ON round1_questions;
DROP POLICY IF EXISTS "Allow public insert access to round1_questions" ON round1_questions;
DROP POLICY IF EXISTS "Allow public update access to round1_questions" ON round1_questions;
DROP POLICY IF EXISTS "Allow public delete access to round1_questions" ON round1_questions;
DROP POLICY IF EXISTS "Allow public read access to round2_challenges" ON round2_challenges;
DROP POLICY IF EXISTS "Allow public insert access to round2_challenges" ON round2_challenges;
DROP POLICY IF EXISTS "Allow public update access to round2_challenges" ON round2_challenges;
DROP POLICY IF EXISTS "Allow public delete access to round2_challenges" ON round2_challenges;

-- Create policies for round1_questions
CREATE POLICY "Allow public read access to round1_questions" ON round1_questions FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to round1_questions" ON round1_questions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to round1_questions" ON round1_questions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to round1_questions" ON round1_questions FOR DELETE USING (true);

-- Create policies for round2_challenges
CREATE POLICY "Allow public read access to round2_challenges" ON round2_challenges FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to round2_challenges" ON round2_challenges FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to round2_challenges" ON round2_challenges FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to round2_challenges" ON round2_challenges FOR DELETE USING (true);
