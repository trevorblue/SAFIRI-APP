-- Run once in Supabase SQL Editor.
-- Makes the receipts bucket private and replaces public read with
-- authenticated-only access (required for signed URL generation).

UPDATE storage.buckets SET public = false WHERE id = 'receipts';

DROP POLICY IF EXISTS "Public read for receipts" ON storage.objects;

DROP POLICY IF EXISTS "Authenticated users can read receipts" ON storage.objects;
CREATE POLICY "Authenticated users can read receipts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'receipts');
