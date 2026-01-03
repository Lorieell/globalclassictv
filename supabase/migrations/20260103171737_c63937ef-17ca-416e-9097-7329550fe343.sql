-- Add unique constraint for session_id + media_id on watch_progress
-- This is needed for upsert to work correctly for resume functionality
ALTER TABLE public.watch_progress
ADD CONSTRAINT watch_progress_session_media_unique
UNIQUE (session_id, media_id);