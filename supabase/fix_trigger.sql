-- Fix User Creation Trigger
-- This script replaces the existing trigger with a robust version to fix "Database error saving new user".

-- 1. Create a safe/robust handler function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    -- Try to get name from metadata, fallback to email local part
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent error if user already exists
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing trigger (if any name variations exist)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Re-create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Ensure permissions are correct
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.users TO anon, authenticated, service_role;

-- 5. Verification: Check if public.users is writable by the trigger
-- (Security Definer handles this, but explicit grants help avoid edge cases)
