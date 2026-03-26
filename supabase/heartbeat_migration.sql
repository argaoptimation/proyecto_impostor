-- ═══════════════════════════════════════════════════════════════════
-- HEARTBEAT MIGRATION: Add last_seen column to players table
-- Run this in Supabase SQL Editor (Dashboard > SQL > New Query)
-- ═══════════════════════════════════════════════════════════════════

-- 1. Add the column with a default of NOW()
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS last_seen timestamptz DEFAULT now();

-- 2. Update existing rows to have a current timestamp
UPDATE players SET last_seen = now() WHERE last_seen IS NULL;
