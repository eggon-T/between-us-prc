-- Make Instagram URL a required field
-- Migration: 20260211_instagram_required.sql

-- Add NOT NULL constraint to instagram_url
ALTER TABLE public.users 
ALTER COLUMN instagram_url SET NOT NULL;

-- Add a check constraint to ensure it's not empty
ALTER TABLE public.users 
ADD CONSTRAINT instagram_url_not_empty 
CHECK (length(trim(instagram_url)) > 0);

-- Optional: Add a check to ensure it looks like an Instagram URL
ALTER TABLE public.users 
ADD CONSTRAINT instagram_url_format 
CHECK (instagram_url ~* '^https?://(www\.)?(instagram\.com|instagr\.am)/');
