-- Revert Script: Restore Schema to Previous State (with Frontend Compatibility)
-- Run this in Supabase SQL Editor to rollback recent changes

-- 1. Revert 'instagram_url' constraints (Critical for Login Fix)
ALTER TABLE public.users ALTER COLUMN instagram_url DROP NOT NULL;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS instagram_url_not_empty;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS instagram_url_format;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS instagram_url_valid_length;

-- 2. Drop new tables introduced in 'initial_matching_schema' and 'robustness_hardening'
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.likes CASCADE;
DROP TABLE IF EXISTS public.hint_counter CASCADE;

-- 3. Drop new functions BUT KEEP 'get_reveal_status' if possible
-- The frontend (dashboard/layout.js) calls 'get_reveal_status', so let's keep it or recreate a dummy one 
-- to prevent the app from crashing while you fix the login.
-- DROP FUNCTION IF EXISTS public.get_reveal_status(); -- Don't drop this!

-- Drop value-logic functions
DROP FUNCTION IF EXISTS public.select_user(uuid);
DROP FUNCTION IF EXISTS public.deselect_user(uuid);
DROP FUNCTION IF EXISTS public.get_my_selections();
DROP FUNCTION IF EXISTS public.check_max_choices(); 
DROP FUNCTION IF EXISTS public.get_lock_id(uuid, uuid);


-- 4. Restore 'choices' table (if it was dropped, though the migrations didn't seem to drop it)
CREATE TABLE IF NOT EXISTS public.choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chooser_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  chosen_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (chooser_id, chosen_id)
);

-- 5. Restore original function for check_max_choices
CREATE OR REPLACE FUNCTION check_max_choices()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.choices WHERE chooser_id = NEW.chooser_id) >= 5 THEN
    RAISE EXCEPTION 'Maximum of 5 selections allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_max_choices ON public.choices;
CREATE TRIGGER enforce_max_choices
  BEFORE INSERT ON public.choices
  FOR EACH ROW
  EXECUTE FUNCTION check_max_choices();

-- 6. Ensure get_reveal_status exists (in case it was dropped or never created)
-- This dummy version keeps the frontend happy.
CREATE OR REPLACE FUNCTION get_reveal_status()
RETURNS jsonb AS $$
BEGIN
  RETURN jsonb_build_object(
    'server_time', NOW(),
    'deadline', '2026-02-14 00:00:00+00',
    'is_revealed', false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
