-- Add is_featured column to mark content as popular/featured by admin
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- Create index for faster queries on featured content
CREATE INDEX IF NOT EXISTS idx_media_is_featured ON public.media(is_featured) WHERE is_featured = true;