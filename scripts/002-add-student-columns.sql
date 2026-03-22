-- Add missing student detail columns to the players table
-- Run this if the players table already exists without these columns

ALTER TABLE players ADD COLUMN IF NOT EXISTS college VARCHAR(255);
ALTER TABLE players ADD COLUMN IF NOT EXISTS department VARCHAR(255);
ALTER TABLE players ADD COLUMN IF NOT EXISTS year_of_study VARCHAR(50);
ALTER TABLE players ADD COLUMN IF NOT EXISTS contact_number VARCHAR(20);
ALTER TABLE players ADD COLUMN IF NOT EXISTS email VARCHAR(255);
