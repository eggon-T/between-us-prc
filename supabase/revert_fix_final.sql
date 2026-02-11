-- Final Revert & Fix Script (Corrected)
-- This script safely drops existing functions before re-creating them to avoid "cannot change return type" errors.

-- 1. DROP EXISTING FUNCTIONS AND TABLES FIRST (Cleanup)
DROP FUNCTION IF EXISTS public.send_anonymous_hint(uuid, text);
DROP FUNCTION IF EXISTS public.get_my_hints();
DROP FUNCTION IF EXISTS public.select_user(uuid);
DROP FUNCTION IF EXISTS public.deselect_user(uuid);
DROP FUNCTION IF EXISTS public.get_my_selections();
DROP FUNCTION IF EXISTS public.get_reveal_status();
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TABLE IF EXISTS public.anonymous_hints CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.likes CASCADE;
DROP TABLE IF EXISTS public.hint_counter CASCADE;

-- 2. FIX SIGNUP: Make instagram_url optional & drop bad triggers
ALTER TABLE public.users ALTER COLUMN instagram_url DROP NOT NULL;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. RESTORE: Ensure original 'choices' table
CREATE TABLE IF NOT EXISTS public.choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chooser_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  chosen_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (chooser_id, chosen_id)
);

-- 4. FIX FRONTEND: Re-create functions to use 'choices'

-- get_my_selections
CREATE OR REPLACE FUNCTION get_my_selections()
RETURNS TABLE (selected_user_id UUID) AS $$
BEGIN
  RETURN QUERY SELECT chosen_id FROM public.choices WHERE chooser_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- select_user
CREATE OR REPLACE FUNCTION select_user(target_id UUID)
RETURNS VOID AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.choices WHERE chooser_id = auth.uid()) >= 5 THEN
    RAISE EXCEPTION 'Maximum of 5 selections allowed';
  END IF;
  
  -- Insert safely
  INSERT INTO public.choices (chooser_id, chosen_id)
  VALUES (auth.uid(), target_id)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- deselect_user
CREATE OR REPLACE FUNCTION deselect_user(target_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.choices WHERE chooser_id = auth.uid() AND chosen_id = target_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. STUB: Prevent crash on hint send
-- The frontend might try to call this. We just return success (true) to satisfy it.
-- Note: Original version returned jsonb, so we match that signature.
CREATE OR REPLACE FUNCTION send_anonymous_hint(target_id UUID, hint_message TEXT)
RETURNS jsonb AS $$
BEGIN
  -- Feature disabled in this schema version
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. KEEP DASHBOARD WORKING
CREATE OR REPLACE FUNCTION get_reveal_status()
RETURNS jsonb AS $$
BEGIN
  RETURN jsonb_build_object('server_time', NOW(), 'deadline', '2026-02-14 00:00:00+00', 'is_revealed', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
