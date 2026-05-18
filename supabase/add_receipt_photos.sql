-- Run once in Supabase SQL Editor.

-- 1. Add receipt_url column to expenses
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS receipt_url text;

-- 2. Create 'receipts' storage bucket (run in Supabase dashboard > Storage
--    if the INSERT below fails on your plan — some plans need the dashboard).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  true,
  5242880,
  ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif']
)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS for storage objects
DROP POLICY IF EXISTS "Authenticated users can upload receipts" ON storage.objects;
CREATE POLICY "Authenticated users can upload receipts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'receipts');

DROP POLICY IF EXISTS "Public read for receipts" ON storage.objects;
CREATE POLICY "Public read for receipts"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'receipts');

DROP POLICY IF EXISTS "Authenticated users can delete their receipts" ON storage.objects;
CREATE POLICY "Authenticated users can delete their receipts"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'receipts' AND auth.uid() IS NOT NULL);
