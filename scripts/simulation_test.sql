-- 🧪 END-TO-END SIMULATION: "The Love Polygon"
-- Run this entire script in the Supabase SQL Editor to verify the backend logic A-Z.

BEGIN;

-- 1. SETUP: Create Dummy Users in auth.users (if possible) or just mock them in public.users
-- Note: inserting into auth.users is tricky. We'll insert into public.users directly for this simulation
-- assuming foreign keys allow it or we temporarily disable triggers.
-- safer approach: Use hardcoded UUIDs and ensure they exist in public.users.

-- Checking if we can insert into public.users. 
-- In this schema, public.users is usually a mirror of auth.users.
-- We will simulate the existence by inserting fake profiles.

DO $$
DECLARE
  -- Define UUIDs for our actors
  alice_id UUID := '00000000-0000-0000-0000-000000000001';
  bob_id   UUID := '00000000-0000-0000-0000-000000000002';
  charlie_id UUID := '00000000-0000-0000-0000-000000000003';
  dave_id  UUID := '00000000-0000-0000-0000-000000000004';
  eve_id   UUID := '00000000-0000-0000-0000-000000000005';
BEGIN
  RAISE NOTICE '🚀 Starting Love Polygon Simulation...';

  -- CLEANUP (Reset state for these users)
  DELETE FROM public.matches WHERE user1 IN (alice_id, bob_id, charlie_id, dave_id, eve_id) OR user2 IN (alice_id, bob_id, charlie_id, dave_id, eve_id);
  DELETE FROM public.likes WHERE from_user IN (alice_id, bob_id, charlie_id, dave_id, eve_id) OR to_user IN (alice_id, bob_id, charlie_id, dave_id, eve_id);
  DELETE FROM public.hint_counter WHERE user_id IN (alice_id, bob_id, charlie_id, dave_id, eve_id);
  -- Delete users if they exist to start fresh
  DELETE FROM public.users WHERE id IN (alice_id, bob_id, charlie_id, dave_id, eve_id);

  -- INSERT ACTORS
  INSERT INTO public.users (id, email, name) VALUES 
  (alice_id, 'alice@test.com', 'Alice'),
  (bob_id, 'bob@test.com', 'Bob'),
  (charlie_id, 'charlie@test.com', 'Charlie'),
  (dave_id, 'dave@test.com', 'Dave'),
  (eve_id, 'eve@test.com', 'Eve');

  -- 2. ACT 1: OFFICIALLY STARTING SELECTIONS
  
  -- ALICE likes BOB
  PERFORM set_config('request.jwt.claim.sub', alice_id::text, true);
  PERFORM select_user(bob_id);
  
  -- ALICE likes CHARLIE
  PERFORM set_config('request.jwt.claim.sub', alice_id::text, true);
  PERFORM select_user(charlie_id);

  -- BOB likes ALICE (Should Create Match!)
  PERFORM set_config('request.jwt.claim.sub', bob_id::text, true);
  PERFORM select_user(alice_id);

  -- CHARLIE likes ALICE (Should Create Match!)
  PERFORM set_config('request.jwt.claim.sub', charlie_id::text, true);
  PERFORM select_user(alice_id);

  -- DAVE likes ALICE (One way like)
  PERFORM set_config('request.jwt.claim.sub', dave_id::text, true);
  PERFORM select_user(alice_id);

  -- EVE likes BOB (One way like)
  PERFORM set_config('request.jwt.claim.sub', eve_id::text, true);
  PERFORM select_user(bob_id);
  
  RAISE NOTICE '✅ Selections Complete.';
  
END $$;


-- 3. VERIFICATION (The "Reveal Day" State)

DO $$ 
DECLARE
  alice_id UUID := '00000000-0000-0000-0000-000000000001';
  bob_id   UUID := '00000000-0000-0000-0000-000000000002';
  charlie_id UUID := '00000000-0000-0000-0000-000000000003';
  dave_id  UUID := '00000000-0000-0000-0000-000000000004';
  eve_id   UUID := '00000000-0000-0000-0000-000000000005';
  
  matches_count INT;
  hints_count INT;
BEGIN
  -- CHECK ALICE
  SELECT count(*) INTO matches_count FROM public.matches WHERE user1 = alice_id OR user2 = alice_id;
  SELECT count INTO hints_count FROM public.hint_counter WHERE user_id = alice_id;
  
  IF matches_count = 2 AND hints_count = 1 THEN
    RAISE NOTICE '🏆 Alice Test PASSED (2 Matches, 1 Hint)';
  ELSE
    RAISE NOTICE '❌ Alice Test FAILED. Got % matches, % hints. Expected 2, 1.', matches_count, hints_count;
  END IF;

  -- CHECK BOB
  SELECT count(*) INTO matches_count FROM public.matches WHERE user1 = bob_id OR user2 = bob_id;
  SELECT count INTO hints_count FROM public.hint_counter WHERE user_id = bob_id;
  
  IF matches_count = 1 AND hints_count = 1 THEN
    RAISE NOTICE '🏆 Bob Test PASSED (1 Match, 1 Hint)';
  ELSE
    RAISE NOTICE '❌ Bob Test FAILED. Got % matches, % hints. Expected 1, 1.', matches_count, hints_count;
  END IF;

  -- CHECK DAVE (Unrequited love)
  SELECT count(*) INTO matches_count FROM public.matches WHERE user1 = dave_id OR user2 = dave_id;
  
  -- Hint count might be null if 0 rows, handle null
  SELECT COALESCE(sum(count), 0) INTO hints_count FROM public.hint_counter WHERE user_id = dave_id;
  
  IF matches_count = 0 AND hints_count = 0 THEN
    RAISE NOTICE '🏆 Dave Test PASSED (0 Matches, 0 Hints)';
  ELSE
    RAISE NOTICE '❌ Dave Test FAILED. Got % matches, % hints. Expected 0, 0.', matches_count, hints_count;
  END IF;

END $$;

ROLLBACK; -- ⚠️ ROLLBACK so we don't actually junk up your DB. Change to COMMIT if you want to keep data.
