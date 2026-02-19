-- 1. Add invoice_url column to leads table
ALTER TABLE IF EXISTS public.leads 
ADD COLUMN IF NOT EXISTS invoice_url TEXT;

-- 2. Create 'invoices' bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies for invoices
DROP POLICY IF EXISTS "Public Select Invoices" ON storage.objects;
CREATE POLICY "Public Select Invoices"
ON storage.objects FOR SELECT
USING ( bucket_id = 'invoices' );

DROP POLICY IF EXISTS "Public Insert Invoices" ON storage.objects;
CREATE POLICY "Public Insert Invoices"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'invoices' );
