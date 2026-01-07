-- Create table to track deleted TMDB IDs (to prevent re-importing)
CREATE TABLE public.deleted_tmdb_ids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tmdb_id INTEGER NOT NULL UNIQUE,
  media_type TEXT NOT NULL DEFAULT 'film',
  title TEXT,
  deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.deleted_tmdb_ids ENABLE ROW LEVEL SECURITY;

-- Policies: Anyone can view, only admins can manage
CREATE POLICY "Anyone can view deleted TMDB IDs" 
ON public.deleted_tmdb_ids 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage deleted TMDB IDs" 
ON public.deleted_tmdb_ids 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add new fields to media table for additional details
ALTER TABLE public.media 
ADD COLUMN IF NOT EXISTS budget BIGINT,
ADD COLUMN IF NOT EXISTS revenue BIGINT,
ADD COLUMN IF NOT EXISTS writers TEXT[],
ADD COLUMN IF NOT EXISTS characters TEXT[],
ADD COLUMN IF NOT EXISTS original_language TEXT,
ADD COLUMN IF NOT EXISTS tagline TEXT,
ADD COLUMN IF NOT EXISTS production_companies TEXT[],
ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false;

-- Create index on deleted_tmdb_ids for fast lookups
CREATE INDEX idx_deleted_tmdb_ids_tmdb_id ON public.deleted_tmdb_ids(tmdb_id);