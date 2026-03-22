-- Create students table with detailed information
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255),
  college VARCHAR(255),
  department VARCHAR(255),
  year_of_study VARCHAR(50),
  contact_number VARCHAR(20),
  email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance table to track student performance
CREATE TABLE IF NOT EXISTS student_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
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

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_code ON students(student_code);
CREATE INDEX IF NOT EXISTS idx_performance_student ON student_performance(student_id);
