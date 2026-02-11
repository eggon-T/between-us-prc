-- ==========================================
-- FIX: Database Trigger for New Users
-- Run this script in the Supabase SQL Editor.
-- ==========================================

-- 1. Ensure 'users' table exists and columns are nullable
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  department TEXT,
  year TEXT,
  gender TEXT,
  instagram_url TEXT
);

-- Make sure these columns don't have NOT NULL constraints
ALTER TABLE public.users ALTER COLUMN department DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN year DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN gender DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN instagram_url DROP NOT NULL;

-- 2. Improve the Trigger Function
-- We use SECURITY DEFINER to ensure it has permission to write to public.users
-- We use SET search_path = public to avoid path resolution issues
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    -- Smart name fallback: metadata -> email prefix -> "Student"
    COALESCE(
      NEW.raw_user_meta_data->>'full_name', 
      NEW.raw_user_meta_data->>'name', 
      split_part(NEW.email, '@', 1),
      'Student'
    ),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    -- Only update name if it was empty/null
    full_name = CASE 
      WHEN public.users.full_name IS NULL OR public.users.full_name = '' 
      THEN EXCLUDED.full_name 
      ELSE public.users.full_name 
    END;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Re-create the Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Grant Permissions (Critical fix for "Database error")
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 5. Ensure RLS is enabled but policies exist (See fix_rls.sql for policies)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
