-- NEW START: Rebuild Database from Scratch (Correct Logic)
-- This script WIPES existing data and recreates the schema correctly.

-- 1. CLEANUP: Drop everything first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.select_user(uuid);
DROP FUNCTION IF EXISTS public.deselect_user(uuid);
DROP FUNCTION IF EXISTS public.get_my_selections();
DROP FUNCTION IF EXISTS public.get_reveal_status();
DROP FUNCTION IF EXISTS public.get_my_hints();
DROP FUNCTION IF EXISTS public.send_anonymous_hint(uuid, text);

DROP VIEW IF EXISTS public.matches;
DROP TABLE IF EXISTS public.choices CASCADE;
DROP TABLE IF EXISTS public.anonymous_hints CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE; -- Drop table if exists (legacy)
DROP TABLE IF EXISTS public.likes CASCADE;
DROP TABLE IF EXISTS public.hint_counter CASCADE;
-- We keep 'users' generally, but if you want full wipe, uncomment below:
-- DROP TABLE IF EXISTS public.users CASCADE; 

-- 2. USERS TABLE (Ensure it's correct)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  department TEXT,
  year TEXT,
  gender TEXT,
  instagram_url TEXT, -- OPTIONAL
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT instagram_url_optional CHECK (instagram_url IS NULL OR length(instagram_url) > 0)
);

-- 3. CHOICES TABLE (The Core Logic)
-- User A chooses User B. Max 5 choices per user.
CREATE TABLE IF NOT EXISTS public.choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chooser_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  chosen_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (chooser_id, chosen_id), -- Can't choose same person twice
  CHECK (chooser_id != chosen_id) -- Can't choose yourself
);

-- 4. MATCHES VIEW (The "Mutual" Logic)
-- A Match exists IF and ONLY IF A chooses B AND B chooses A.
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

-- Grant access to view
GRANT SELECT ON public.matches TO anon, authenticated, service_role;


-- 5. RPC FUNCTIONS (Frontend API)

-- select_user
CREATE OR REPLACE FUNCTION select_user(target_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Max 5 check
  IF (SELECT COUNT(*) FROM public.choices WHERE chooser_id = auth.uid()) >= 5 THEN
    RAISE EXCEPTION 'Maximum of 5 selections allowed';
  END IF;

  INSERT INTO public.choices (chooser_id, chosen_id)
  VALUES (auth.uid(), target_id)
  ON CONFLICT (chooser_id, chosen_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- deselect_user
CREATE OR REPLACE FUNCTION deselect_user(target_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.choices WHERE chooser_id = auth.uid() AND chosen_id = target_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_my_selections
CREATE OR REPLACE FUNCTION get_my_selections()
RETURNS TABLE (selected_user_id UUID) AS $$
BEGIN
  RETURN QUERY SELECT chosen_id FROM public.choices WHERE chooser_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_reveal_status
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

-- get_my_hints (Stub for now)
CREATE OR REPLACE FUNCTION get_my_hints()
RETURNS TABLE (hint_text TEXT, created_at TIMESTAMPTZ) AS $$
BEGIN
  RETURN; -- Empty
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- send_anonymous_hint (Stub for now)
CREATE OR REPLACE FUNCTION send_anonymous_hint(target_id UUID, hint_message TEXT)
RETURNS jsonb AS $$
BEGIN
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. USER PROFILE TRIGGER (Optional Safety)
-- This ensures public.users row exists when a user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, created_at)
  VALUES (
    NEW.id,
    NEW.email, 
    -- Basic name fallback
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-bind trigger (Safe version)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. PERMISSIONS
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
