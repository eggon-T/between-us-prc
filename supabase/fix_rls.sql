-- FIX: Row Level Security (RLS) Policies (SAFE VERSION)
-- Ensures existing policies are dropped before creating new ones.

-- 1. Enable RLS on 'users' table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies (to start fresh)
-- Be explicit about 'IF EXISTS' to avoid errors if they are already gone.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- 3. Create NEW policies for 'users'
-- View: Everyone can see profiles
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.users FOR SELECT USING (true);

-- Insert: Users can create their own profile
CREATE POLICY "Users can insert their own profile" 
ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Update: Users can update ONLY their own profile
CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE USING (auth.uid() = id);

-- 4. Enable RLS on 'choices' table
ALTER TABLE public.choices ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies for 'choices'
DROP POLICY IF EXISTS "Users can view their own choices" ON public.choices;
DROP POLICY IF EXISTS "Users can insert their own choices" ON public.choices;
DROP POLICY IF EXISTS "Users can delete their own choices" ON public.choices;

-- 6. Create NEW policies for 'choices'
CREATE POLICY "Users can view their own choices" 
ON public.choices FOR SELECT USING (auth.uid() = chooser_id);

CREATE POLICY "Users can insert their own choices" 
ON public.choices FOR INSERT WITH CHECK (auth.uid() = chooser_id);

CREATE POLICY "Users can delete their own choices" 
ON public.choices FOR DELETE USING (auth.uid() = chooser_id);
