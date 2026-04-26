/*
  # Storage policies for receipts bucket

  1. Security
    - Enable public read on receipts bucket (so admin can view uploaded receipts)
    - Authenticated users can upload to their own folder
    - Authenticated users can read all receipts (admin needs access)
*/

-- Allow authenticated users to upload receipts
CREATE POLICY "Authenticated users can upload receipts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to read receipts
CREATE POLICY "Authenticated users can read receipts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'receipts');

-- Allow public read on receipts (for preview)
CREATE POLICY "Public can read receipts"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'receipts');
