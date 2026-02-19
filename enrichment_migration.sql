-- SQL Migration to add 'enrichment_data' JSONB column
ALTER TABLE potential_b2b_leads 
ADD COLUMN IF NOT EXISTS enrichment_data JSONB DEFAULT '{}'::jsonb;
