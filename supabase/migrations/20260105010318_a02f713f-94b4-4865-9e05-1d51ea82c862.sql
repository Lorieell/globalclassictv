-- Fix RLS policies for user behavior tables
-- These tables use session_id for anonymous users and user_id for authenticated users

-- =====================
-- WATCHLIST TABLE
-- =====================
DROP POLICY IF EXISTS "Users can add to watchlist" ON watchlist;
DROP POLICY IF EXISTS "Users can remove from watchlist" ON watchlist;
DROP POLICY IF EXISTS "Users can view their watchlist" ON watchlist;

-- Users can only view their own watchlist
CREATE POLICY "Users can view their watchlist" ON watchlist
  FOR SELECT
  USING (
    (user_id IS NOT NULL AND user_id = auth.uid()) 
    OR (user_id IS NULL AND session_id IS NOT NULL)
  );

-- Users can only add to their own watchlist
CREATE POLICY "Users can add to watchlist" ON watchlist
  FOR INSERT
  WITH CHECK (
    (user_id IS NOT NULL AND user_id = auth.uid()) 
    OR (user_id IS NULL AND session_id IS NOT NULL)
  );

-- Users can only remove from their own watchlist
CREATE POLICY "Users can remove from watchlist" ON watchlist
  FOR DELETE
  USING (
    (user_id IS NOT NULL AND user_id = auth.uid()) 
    OR (user_id IS NULL AND session_id IS NOT NULL)
  );

-- =====================
-- FAVORITES TABLE
-- =====================
DROP POLICY IF EXISTS "Users can add to favorites" ON favorites;
DROP POLICY IF EXISTS "Users can remove from favorites" ON favorites;
DROP POLICY IF EXISTS "Users can view their favorites" ON favorites;

-- Users can only view their own favorites
CREATE POLICY "Users can view their favorites" ON favorites
  FOR SELECT
  USING (
    (user_id IS NOT NULL AND user_id = auth.uid()) 
    OR (user_id IS NULL AND session_id IS NOT NULL)
  );

-- Users can only add to their own favorites
CREATE POLICY "Users can add to favorites" ON favorites
  FOR INSERT
  WITH CHECK (
    (user_id IS NOT NULL AND user_id = auth.uid()) 
    OR (user_id IS NULL AND session_id IS NOT NULL)
  );

-- Users can only remove from their own favorites
CREATE POLICY "Users can remove from favorites" ON favorites
  FOR DELETE
  USING (
    (user_id IS NOT NULL AND user_id = auth.uid()) 
    OR (user_id IS NULL AND session_id IS NOT NULL)
  );

-- =====================
-- SEEN TABLE
-- =====================
DROP POLICY IF EXISTS "Users can add to seen" ON seen;
DROP POLICY IF EXISTS "Users can remove from seen" ON seen;
DROP POLICY IF EXISTS "Users can view their seen" ON seen;

-- Users can only view their own seen list
CREATE POLICY "Users can view their seen" ON seen
  FOR SELECT
  USING (
    (user_id IS NOT NULL AND user_id = auth.uid()) 
    OR (user_id IS NULL AND session_id IS NOT NULL)
  );

-- Users can only add to their own seen list
CREATE POLICY "Users can add to seen" ON seen
  FOR INSERT
  WITH CHECK (
    (user_id IS NOT NULL AND user_id = auth.uid()) 
    OR (user_id IS NULL AND session_id IS NOT NULL)
  );

-- Users can only remove from their own seen list
CREATE POLICY "Users can remove from seen" ON seen
  FOR DELETE
  USING (
    (user_id IS NOT NULL AND user_id = auth.uid()) 
    OR (user_id IS NULL AND session_id IS NOT NULL)
  );

-- =====================
-- WATCH_PROGRESS TABLE
-- =====================
DROP POLICY IF EXISTS "Users can update their progress" ON watch_progress;
DROP POLICY IF EXISTS "Users can delete their progress" ON watch_progress;
DROP POLICY IF EXISTS "Users can modify their progress" ON watch_progress;
DROP POLICY IF EXISTS "Users can view their progress" ON watch_progress;

-- Users can only view their own progress
CREATE POLICY "Users can view their progress" ON watch_progress
  FOR SELECT
  USING (
    (user_id IS NOT NULL AND user_id = auth.uid()) 
    OR (user_id IS NULL AND session_id IS NOT NULL)
  );

-- Users can only insert their own progress
CREATE POLICY "Users can update their progress" ON watch_progress
  FOR INSERT
  WITH CHECK (
    (user_id IS NOT NULL AND user_id = auth.uid()) 
    OR (user_id IS NULL AND session_id IS NOT NULL)
  );

-- Users can only modify their own progress
CREATE POLICY "Users can modify their progress" ON watch_progress
  FOR UPDATE
  USING (
    (user_id IS NOT NULL AND user_id = auth.uid()) 
    OR (user_id IS NULL AND session_id IS NOT NULL)
  );

-- Users can only delete their own progress
CREATE POLICY "Users can delete their progress" ON watch_progress
  FOR DELETE
  USING (
    (user_id IS NOT NULL AND user_id = auth.uid()) 
    OR (user_id IS NULL AND session_id IS NOT NULL)
  );