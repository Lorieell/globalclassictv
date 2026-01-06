-- Add is_ongoing column to media table for tracking series that are still in production
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS is_ongoing boolean DEFAULT false;

-- Create notifications table for site updates, bug fixes, and new content
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'update', -- 'update', 'bugfix', 'new_content', 'new_video'
  media_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  is_read boolean DEFAULT false,
  session_id text,
  user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Anyone can view global notifications" 
ON public.notifications 
FOR SELECT 
USING (session_id IS NULL AND user_id IS NULL);

CREATE POLICY "Users can view their notifications" 
ON public.notifications 
FOR SELECT 
USING ((session_id IS NOT NULL) OR (user_id IS NOT NULL AND user_id = auth.uid()));

CREATE POLICY "Admins can manage all notifications" 
ON public.notifications 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_session ON public.notifications(session_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);