-- FIX: Backend Compatibility Layer (Safe Version)
-- This script mocks the functions/tables expected by the frontend
-- so the app works without any frontend code changes.

-- 1. Ensure clean slate (Drop table/view to avoid conflicts)
DROP VIEW IF EXISTS public.matches;
DROP TABLE IF EXISTS public.matches CASCADE;

-- 2. Create 'matches' VIEW from mutual 'choices'
-- This simulates the 'matches' table for the frontend query
CREATE OR REPLACE VIEW public.matches AS
SELECT 
  LEAST(c1.chooser_id, c1.chosen_id) as user1,
  GREATEST(c1.chooser_id, c1.chosen_id) as user2,
  NOW() as created_at
FROM public.choices c1
JOIN public.choices c2 
  ON c1.chosen_id = c2.chooser_id 
  AND c1.chooser_id = c2.chosen_id
WHERE c1.chooser_id < c1.chosen_id; -- Ensure unique pairs

-- Grant access
GRANT SELECT ON public.matches TO anon, authenticated, service_role;

-- 3. Restore 'get_my_hints' (Stub)
-- The frontend needs this function to exist.
-- Since the 'anonymous_hints' table is gone, we return empty.
DROP FUNCTION IF EXISTS get_my_hints();
CREATE OR REPLACE FUNCTION get_my_hints()
RETURNS TABLE (hint_text TEXT, created_at TIMESTAMPTZ) AS $$
BEGIN
  -- Empty result set (no hints support in this schema)
  RETURN; 
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Check 'choices' table existence (just in case)
CREATE TABLE IF NOT EXISTS public.choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chooser_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  chosen_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (chooser_id, chosen_id)
);
