import pg from 'pg';

const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const sql = `
-- Create students table for storing student information
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255),
  college VARCHAR(255),
  department VARCHAR(255),
  year_of_study VARCHAR(50),
  contact_number VARCHAR(20),
  email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create student_performance table for tracking competition progress
CREATE TABLE IF NOT EXISTS student_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  round1_score INTEGER DEFAULT 0,
  round2_score INTEGER DEFAULT 0,
  round1_completed BOOLEAN DEFAULT FALSE,
  round2_enabled BOOLEAN DEFAULT FALSE,
  round2_completed BOOLEAN DEFAULT FALSE,
  tab_switch_count INTEGER DEFAULT 0,
  is_disqualified BOOLEAN DEFAULT FALSE,
  round1_answers JSONB DEFAULT '{}',
  start_time BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id)
);

-- Create legacy players table for backward compatibility
CREATE TABLE IF NOT EXISTS players (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  score INTEGER DEFAULT 0,
  round1_score INTEGER DEFAULT 0,
  round2_score INTEGER DEFAULT 0,
  round1_completed BOOLEAN DEFAULT FALSE,
  round2_enabled BOOLEAN DEFAULT FALSE,
  round2_completed BOOLEAN DEFAULT FALSE,
  tab_switch_count INTEGER DEFAULT 0,
  is_disqualified BOOLEAN DEFAULT FALSE,
  round1_answers JSONB DEFAULT '{}',
  start_time BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_students_student_code ON students(student_code);
CREATE INDEX IF NOT EXISTS idx_student_performance_student_id ON student_performance(student_id);
CREATE INDEX IF NOT EXISTS idx_players_score ON players(score DESC);
`;

const rlsPolicies = `
-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read access to students" ON students;
DROP POLICY IF EXISTS "Allow public insert access to students" ON students;
DROP POLICY IF EXISTS "Allow public update access to students" ON students;
DROP POLICY IF EXISTS "Allow public delete access to students" ON students;

DROP POLICY IF EXISTS "Allow public read access to student_performance" ON student_performance;
DROP POLICY IF EXISTS "Allow public insert access to student_performance" ON student_performance;
DROP POLICY IF EXISTS "Allow public update access to student_performance" ON student_performance;
DROP POLICY IF EXISTS "Allow public delete access to student_performance" ON student_performance;

DROP POLICY IF EXISTS "Allow public read access to players" ON players;
DROP POLICY IF EXISTS "Allow public insert access to players" ON players;
DROP POLICY IF EXISTS "Allow public update access to players" ON players;
DROP POLICY IF EXISTS "Allow public delete access to players" ON players;

-- Create policies for public access (for the symposium app)
-- Students table policies
CREATE POLICY "Allow public read access to students" ON students
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to students" ON students
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to students" ON students
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to students" ON students
  FOR DELETE USING (true);

-- Student performance table policies
CREATE POLICY "Allow public read access to student_performance" ON student_performance
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to student_performance" ON student_performance
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to student_performance" ON student_performance
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to student_performance" ON student_performance
  FOR DELETE USING (true);

-- Players table policies
CREATE POLICY "Allow public read access to players" ON players
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to players" ON players
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to players" ON players
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to players" ON players
  FOR DELETE USING (true);
`;

async function runMigration() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to Supabase database...');
    await client.connect();
    console.log('Connected successfully!');

    console.log('Creating tables and indexes...');
    await client.query(sql);
    console.log('Tables and indexes created successfully!');

    console.log('Setting up Row Level Security policies...');
    await client.query(rlsPolicies);
    console.log('RLS policies created successfully!');

    // Verify tables were created
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('students', 'student_performance', 'players')
    `);
    
    console.log('\nCreated tables:');
    result.rows.forEach(row => console.log(`  - ${row.table_name}`));
    
    console.log('\nMigration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
