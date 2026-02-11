-- Final Fix: Drop the Problematic Trigger
-- The application works fine without this trigger because the frontend manages profile creation.
-- Dropping this trigger removes the code that is raising "Database error saving new user".

-- 1. Drop the trigger from auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Drop the function to clean up
DROP FUNCTION IF EXISTS public.handle_new_user();

-- That's it!
-- With no trigger, your signup will succeed, and the app will ask you to "Complete Profile", which is normal behavior.
