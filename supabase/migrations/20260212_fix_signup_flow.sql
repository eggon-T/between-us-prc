-- Fix Signup Flow: Make instagram_url nullable again
-- The previous migration `20260211_instagram_required.sql` added a NOT NULL constraint
-- which breaks the initial user creation trigger because the user hasn't provided
-- their Instagram handle yet at the moment of Google Sign In.

-- 1. Drop the NOT NULL constraint
ALTER TABLE public.users ALTER COLUMN instagram_url DROP NOT NULL;

-- 2. Drop the length check constraint if it doesn't handle NULLs gracefully, 
-- or just to be safe. (Postgres CHECK passes on NULL, but let's be sure).
-- The previous check was: CHECK (length(trim(instagram_url)) > 0);
-- We can keep it or refine it. If we assume NULL is allowed, we don't need to drop it 
-- because length(NULL) is NULL which satisfies the constraint. 
-- BUT, if the trigger inserts an empty string '' instead of NULL, it would fail.
-- Let's drop it to be safe and rely on the frontend validation for now, 
-- or replace it with a check that explicitly allows NULL.

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS instagram_url_not_empty;

-- Re-add a safer constraint that allows NULL but forbids empty/whitespace strings
ALTER TABLE public.users 
ADD CONSTRAINT instagram_url_valid_length 
CHECK (instagram_url IS NULL OR length(trim(instagram_url)) > 0);
