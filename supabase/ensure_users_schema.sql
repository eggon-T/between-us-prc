-- Ensure users table has necessary columns for the application to function correctly
-- This script is idempotent and safe to run multiple times.

-- 1. Add columns if they don't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS year TEXT;

-- 2. Add constraint for instagram_url (Optional but good practice)
-- We use a DO block to check if constraint exists before adding it to avoid errors
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'instagram_url_check') THEN
        ALTER TABLE public.users ADD CONSTRAINT instagram_url_check 
        CHECK (instagram_url IS NULL OR length(instagram_url) > 0);
    END IF;
END $$;

-- 3. Verify RLS is enabled (Safety check)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
