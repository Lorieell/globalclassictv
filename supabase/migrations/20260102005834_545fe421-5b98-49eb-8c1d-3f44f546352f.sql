-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily TMDB import at 3am
SELECT cron.schedule(
  'daily-tmdb-import',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://tcqcjwsizupbbfuzuesb.supabase.co/functions/v1/tmdb-import',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjcWNqd3NpenVwYmJmdXp1ZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczMDQ0NjIsImV4cCI6MjA4Mjg4MDQ2Mn0.ftYnxfvy1O092DJpfytw0GMch5YCLf3O0JBzdnmWK58"}'::jsonb,
    body := '{"type": "all", "pages": 2}'::jsonb
  ) AS request_id;
  $$
);