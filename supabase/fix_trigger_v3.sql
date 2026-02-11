-- Fix User Creation Trigger (Version 3: Orphan Cleanup)
-- This script replaces the trigger and handles cases where old data might be stuck.

-- 1. Create a safe/robust handler function that cleans up orphans
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Orphan Cleanup: Remove any existing public profile with this email
  -- (In case previous delete didn't cascade properly)
  DELETE FROM public.users WHERE email = NEW.email;

  -- 2. Insert new profile
  INSERT INTO public.users (id, email, full_name, created_at, instagram_url)
  VALUES (
    NEW.id,
    NEW.email,
    -- Try to get name even if metadata is weird, fallback to email local part
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NOW(),
    NULL -- Ensure instagram_url is NULL initially
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    created_at = EXCLUDED.created_at;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing trigger to ensure fresh binding
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Re-create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Check permissions (just in case)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.users TO postgres, anon, authenticated, service_role;
