-- Create table for ad statistics
CREATE TABLE public.ad_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id TEXT NOT NULL,
  zone_id TEXT,
  ad_type TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('impression', 'click')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_ad_stats_created_at ON public.ad_stats(created_at DESC);
CREATE INDEX idx_ad_stats_ad_id ON public.ad_stats(ad_id);
CREATE INDEX idx_ad_stats_event_type ON public.ad_stats(event_type);

-- Enable Row Level Security
ALTER TABLE public.ad_stats ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert stats (for tracking)
CREATE POLICY "Anyone can insert ad stats" 
ON public.ad_stats 
FOR INSERT 
WITH CHECK (true);

-- Only admins can view stats
CREATE POLICY "Admins can view ad stats" 
ON public.ad_stats 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);