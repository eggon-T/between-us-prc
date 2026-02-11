-- Secure Reveal Logic Migration

-- 1. Helper RPC to get server time and reveal status
-- This serves as the single source of truth for the frontend
CREATE OR REPLACE FUNCTION get_reveal_status()
RETURNS jsonb AS $$
DECLARE
  -- DEADLINE: Feb 14, 2026 00:00:00 IST = Feb 13, 2026 18:30:00 UTC
  deadline TIMESTAMPTZ := '2026-02-13 18:30:00+00';
  now_time TIMESTAMPTZ := NOW();
  is_revealed BOOLEAN;
BEGIN
  is_revealed := now_time >= deadline;
  
  RETURN jsonb_build_object(
    'server_time', now_time,
    'deadline', deadline,
    'is_revealed', is_revealed
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Update RLS on 'matches' table to strict 'Time-Gated' Access
-- We first enable RLS (idempotent)
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Drop loose policies if they exist (names guesses based on common patterns)
DROP POLICY IF EXISTS "Users can view their own matches" ON public.matches;
DROP POLICY IF EXISTS "match_view_policy" ON public.matches;
DROP POLICY IF EXISTS "Public view" ON public.matches;
DROP POLICY IF EXISTS "Users can view matches ONLY after deadline" ON public.matches;

-- Create the STRICT policy
-- Rules: 
-- 1. User must be one of the participants (user1 or user2)
-- 2. AND Current DB Time must be PAST the deadline
CREATE POLICY "Users can view matches ONLY after deadline"
ON public.matches
FOR SELECT
USING (
  (auth.uid() = user1 OR auth.uid() = user2)
  AND
  (NOW() >= '2026-02-13 18:30:00+00') 
);

-- Note: We don't need INSERT/UPDATE/DELETE policies for the client
-- because all modifications happen via `select_user` / `deselect_user` RPCs 
-- which utilize SECURITY DEFINER to bypass RLS.
