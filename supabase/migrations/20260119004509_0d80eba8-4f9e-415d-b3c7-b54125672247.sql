-- Add image_url column to notifications
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage bucket for notification images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('notification-images', 'notification-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to notification images
CREATE POLICY "Public read access for notification images"
ON storage.objects FOR SELECT
USING (bucket_id = 'notification-images');

-- Allow authenticated admins to upload notification images
CREATE POLICY "Admin upload access for notification images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'notification-images');

-- Allow admins to delete notification images
CREATE POLICY "Admin delete access for notification images"
ON storage.objects FOR DELETE
USING (bucket_id = 'notification-images');