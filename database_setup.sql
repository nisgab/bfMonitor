-- Database setup for Breastfeeding Monitor Application
-- Run this in your Supabase SQL Editor

-- Create the feeding_sessions table
CREATE TABLE feeding_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    side VARCHAR(10) NOT NULL CHECK (side IN ('left', 'right')),
    duration INTEGER NOT NULL, -- Duration in seconds
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE feeding_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feeding_sessions_user_id ON feeding_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_feeding_sessions_created_at ON feeding_sessions(created_at DESC);

-- Optional: Create a view for recent sessions (last 3 sessions per user)
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

-- Create a function to get user's feeding statistics
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

-- Add some useful comments
COMMENT ON TABLE feeding_sessions IS 'Stores breastfeeding session data for each user';
COMMENT ON COLUMN feeding_sessions.side IS 'Which side was used for feeding: left or right';
COMMENT ON COLUMN feeding_sessions.duration IS 'Duration of feeding session in seconds';
COMMENT ON COLUMN feeding_sessions.start_time IS 'When the feeding session started';
COMMENT ON COLUMN feeding_sessions.created_at IS 'When the record was created in the database';

-- Security notes:
-- 1. Authenticated users can only access their own data (full CRUD)
-- 2. Anonymous users can read all data (needed for shared links)
-- 3. This allows sharing while maintaining user data ownership 