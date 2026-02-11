-- ============================================
-- Supabase SQL Schema for "Between Us PRC"
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  department TEXT,
  year TEXT,
  instagram_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read all profiles (needed for selection)
CREATE POLICY "Anyone can view profiles" ON public.users
  FOR SELECT USING (true);

-- Users can insert/update their own profile
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);


-- 2. Choices table
CREATE TABLE IF NOT EXISTS public.choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chooser_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  chosen_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (chooser_id, chosen_id)
);

-- Enable RLS on choices
ALTER TABLE public.choices ENABLE ROW LEVEL SECURITY;

-- Users can view their own choices
CREATE POLICY "Users can view own choices" ON public.choices
  FOR SELECT USING (auth.uid() = chooser_id OR auth.uid() = chosen_id);

-- Users can insert their own choices
CREATE POLICY "Users can insert own choices" ON public.choices
  FOR INSERT WITH CHECK (auth.uid() = chooser_id);

-- Users can delete their own choices
CREATE POLICY "Users can delete own choices" ON public.choices
  FOR DELETE USING (auth.uid() = chooser_id);


-- 3. Function to enforce max 5 choices
CREATE OR REPLACE FUNCTION check_max_choices()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.choices WHERE chooser_id = NEW.chooser_id) >= 5 THEN
    RAISE EXCEPTION 'Maximum of 5 selections allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_max_choices
  BEFORE INSERT ON public.choices
  FOR EACH ROW
  EXECUTE FUNCTION check_max_choices();
