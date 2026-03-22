# Database Setup Instructions

## Step 1: Create Tables and Schema in Supabase

Go to your Supabase dashboard SQL Editor and run the following SQL script:

**URL:** https://supabase.com/dashboard/project/syidelmiujkdpwvzlhgm/sql

Copy and paste this entire SQL script:

```sql
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
```

Click "Run" to execute the SQL.

## Step 2: Seed Questions Data

I've created a seed script that will insert all 30 Round 1 questions and 5 Round 2 challenges into your database.

To run the seed script in the v0 environment, I'll execute it now. This will populate your database with all the questions.

## What's Changed in Your Code

1. **Database Schema**: Created `round1_questions` and `round2_challenges` tables with proper structure and RLS policies
2. **Question Management**: Updated `lib/supabase/db-actions.ts` with functions to fetch, create, update, and delete questions from the database
3. **Game Store**: Modified `lib/game-store.ts` to include `loadRound1Questions()` and `loadRound2Challenges()` functions
4. **Admin Panel**: Updated to load questions from the database on mount
5. **App Init**: Updated `app/page.tsx` to load questions when the app starts
6. **React Keys**: Fixed duplicate key warnings by using composite keys

## How It Works

- When students take the quiz, questions are fetched from the database
- When admins add/edit/delete questions in the admin panel, changes are persisted to the database
- Questions are loaded automatically when the app starts
- If no questions exist in the database, the system will use default hardcoded questions as a fallback
