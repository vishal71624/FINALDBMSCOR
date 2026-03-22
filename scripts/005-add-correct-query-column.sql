-- Add correct_query column to round2_challenges table
-- This stores the correct SQL query that will be executed to generate expected output dynamically
ALTER TABLE round2_challenges ADD COLUMN IF NOT EXISTS correct_query TEXT;

-- Add a comment for documentation
COMMENT ON COLUMN round2_challenges.correct_query IS 'The correct SQL query that will be executed against test case data to generate expected output';
