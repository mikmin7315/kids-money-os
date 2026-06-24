-- Add photo support to behavior_logs
ALTER TABLE behavior_logs
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS photo_taken_at TIMESTAMPTZ;

-- Create storage bucket for behavior photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('behavior-photos', 'behavior-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to behavior-photos
CREATE POLICY "Authenticated upload behavior photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'behavior-photos');

-- Allow public read of behavior photos
CREATE POLICY "Public read behavior photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'behavior-photos');
