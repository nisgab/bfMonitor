-- Fix RLS Policies for Shared Log View
-- Run this in your Supabase SQL Editor if you already have the feeding_sessions table

-- Drop existing policies
DROP POLICY IF EXISTS "Users can access their own feeding sessions" ON feeding_sessions;
DROP POLICY IF EXISTS "Users can access their own stats" ON feeding_sessions;

-- Policy for authenticated users - they can do everything with their own data
CREATE POLICY "Authenticated users can manage their own sessions" ON feeding_sessions
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy for anonymous users - they can only read (for shared links)
CREATE POLICY "Anonymous users can read sessions for sharing" ON feeding_sessions
    FOR SELECT 
    USING (auth.role() = 'anon');

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_feeding_sessions_user_id ON feeding_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_feeding_sessions_created_at ON feeding_sessions(created_at DESC);

-- Create the recent_feeding_sessions view (if it doesn't exist)
CREATE OR REPLACE VIEW recent_feeding_sessions AS
SELECT *
FROM (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
    FROM feeding_sessions
) ranked
WHERE rn <= 3;

-- Grant permissions for the view
GRANT SELECT ON recent_feeding_sessions TO authenticated, anon;

-- Create the get_feeding_stats function (if it doesn't exist)
CREATE OR REPLACE FUNCTION get_feeding_stats(user_uuid UUID)
RETURNS TABLE (
    total_sessions INTEGER,
    total_duration_minutes INTEGER,
    avg_duration_minutes NUMERIC,
    left_side_count INTEGER,
    right_side_count INTEGER,
    last_feeding_date TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_sessions,
        (SUM(duration) / 60)::INTEGER as total_duration_minutes,
        ROUND(AVG(duration) / 60, 2) as avg_duration_minutes,
        COUNT(CASE WHEN side = 'left' THEN 1 END)::INTEGER as left_side_count,
        COUNT(CASE WHEN side = 'right' THEN 1 END)::INTEGER as right_side_count,
        MAX(created_at) as last_feeding_date
    FROM feeding_sessions
    WHERE user_id = user_uuid;
END;
$$;

-- Grant execute permissions on the function
GRANT EXECUTE ON FUNCTION get_feeding_stats(UUID) TO authenticated, anon; 