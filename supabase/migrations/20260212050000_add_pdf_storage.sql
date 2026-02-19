-- 1. Add pdf_url column to leads table
ALTER TABLE IF EXISTS public.leads 
ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- 2. Create 'proposals' bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('proposals', 'proposals', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies
-- Allow public read access to proposals
DROP POLICY IF EXISTS "Public Select Proposals" ON storage.objects;
CREATE POLICY "Public Select Proposals"
ON storage.objects FOR SELECT
USING ( bucket_id = 'proposals' );

-- Allow public upload access (for now, to let the client upload freely)
-- In production, strict RLS or Edge Function upload is better.
DROP POLICY IF EXISTS "Public Insert Proposals" ON storage.objects;
CREATE POLICY "Public Insert Proposals"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'proposals' );
