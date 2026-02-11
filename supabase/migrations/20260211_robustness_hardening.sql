-- Migration: Robustness Hardening & Deadline Enforcement

-- 1. Helper function for consistent advisory locking based on two UUIDs
CREATE OR REPLACE FUNCTION get_lock_id(u1 UUID, u2 UUID)
RETURNS BIGINT AS $$
DECLARE
  -- Sort UUIDs to ensure (A,B) and (B,A) lock the same resource
  first_uuid UUID := LEAST(u1, u2);
  second_uuid UUID := GREATEST(u1, u2);
BEGIN
  -- Simple hashing to get a 64-bit integer from the combined string
  -- Note: Collisions are possible but rare and acceptable for this use case (will just block unrelated pair briefly)
  RETURN hashtext(first_uuid::text || second_uuid::text);
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- 2. Enhanced select_user with Locking & Deadline
CREATE OR REPLACE FUNCTION select_user(target_id UUID)
RETURNS VOID AS $$
DECLARE
  current_uid UUID;
  u1 UUID;
  u2 UUID;
  existing_like_count INT;
  existing_match_count INT;
  deadline TIMESTAMPTZ := '2026-02-14 01:00:00+00'; -- UTC time, adjust if needed for IST (+5:30)
  -- Or '2026-02-13 19:30:00+00' for 14th 1:00 AM IST
  -- Assuming input meant 1 AM local time, let's stick to a safe backend UTC default or specific offset
  -- Let's use flexible string for now: '2026-02-13 19:30:00+00' corresponds to Feb 14 01:00 AM IST.
BEGIN
  -- A. Deadline Check
  IF NOW() > '2026-02-13 19:30:00+00' THEN  -- 1:00 AM IST on Feb 14
    RAISE EXCEPTION 'Detailed selection period ended at 1:00 AM on Feb 14';
  END IF;

  current_uid := auth.uid();

  -- B. Self-like check
  IF current_uid = target_id THEN
    RAISE EXCEPTION 'Cannot select yourself';
  END IF;

  -- C. Advisory Lock to prevent Race Conditions
  -- This blocks any other transaction trying to modify the relationship between these two users
  PERFORM pg_advisory_xact_lock(get_lock_id(current_uid, target_id));


  -- D. Max 5 selections check (Simulated O(1) via count)
  SELECT count(*) INTO existing_like_count FROM public.likes WHERE from_user = current_uid;
  SELECT count(*) INTO existing_match_count FROM public.matches WHERE user1 = current_uid OR user2 = current_uid;

  IF (existing_like_count + existing_match_count) >= 5 THEN
    RAISE EXCEPTION 'Maximum selections reached';
  END IF;

  -- E. Idempotency Check (After lock)
  IF EXISTS (SELECT 1 FROM public.likes WHERE from_user = current_uid AND to_user = target_id) THEN
     RETURN; -- Already liked, do nothing
  END IF;
  
  u1 := LEAST(current_uid, target_id);
  u2 := GREATEST(current_uid, target_id);

  IF EXISTS (SELECT 1 FROM public.matches WHERE user1 = u1 AND user2 = u2) THEN
     RETURN; -- Already matched, do nothing
  END IF;


  -- F. The Core Logic (Atomic swap)
  -- Step 1: Check reverse like
  IF EXISTS (SELECT 1 FROM public.likes WHERE from_user = target_id AND to_user = current_uid) THEN
    -- MATCH FOUND
    
    INSERT INTO public.matches (user1, user2) VALUES (u1, u2);
    DELETE FROM public.likes WHERE from_user = target_id AND to_user = current_uid;
    
    -- Decrement hint counter for ME
    UPDATE public.hint_counter
    SET count = GREATEST(0, count - 1)
    WHERE user_id = current_uid;

  ELSE
    -- NO MATCH YET -> Store like
    INSERT INTO public.likes (from_user, to_user) VALUES (current_uid, target_id);

    -- Increment hint counter for TARGET
    INSERT INTO public.hint_counter (user_id, count)
    VALUES (target_id, 1)
    ON CONFLICT (user_id)
    DO UPDATE SET count = hint_counter.count + 1;

  END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Enhanced deselect_user with Locking & Deadline
CREATE OR REPLACE FUNCTION deselect_user(target_id UUID)
RETURNS VOID AS $$
DECLARE
  current_uid UUID;
  u1 UUID;
  u2 UUID;
BEGIN
  -- A. Deadline Check
  IF NOW() > '2026-02-13 19:30:00+00' THEN -- 1:00 AM IST on Feb 14
    RAISE EXCEPTION 'Selection locked. You cannot remove likes now.';
  END IF;

  current_uid := auth.uid();
  u1 := LEAST(current_uid, target_id);
  u2 := GREATEST(current_uid, target_id);

  -- B. Advisory Lock
  PERFORM pg_advisory_xact_lock(get_lock_id(current_uid, target_id));

  -- C. Core Logic
  -- Scenario A: It was a Match ?
  IF EXISTS (SELECT 1 FROM public.matches WHERE user1 = u1 AND user2 = u2) THEN
    
    DELETE FROM public.matches WHERE user1 = u1 AND user2 = u2;
    
    -- Restore the OTHER person's like (since they still like me)
    INSERT INTO public.likes (from_user, to_user) VALUES (target_id, current_uid)
    ON CONFLICT DO NOTHING; -- Should not happen if logic is correct, but safe
    
    -- Increment MY hint counter
    INSERT INTO public.hint_counter (user_id, count)
    VALUES (current_uid, 1)
    ON CONFLICT (user_id)
    DO UPDATE SET count = hint_counter.count + 1;

  -- Scenario B: It was just a Like ?
  ELSIF EXISTS (SELECT 1 FROM public.likes WHERE from_user = current_uid AND to_user = target_id) THEN
    
    DELETE FROM public.likes WHERE from_user = current_uid AND to_user = target_id;
    
    -- Decrement TARGET's hint counter
    UPDATE public.hint_counter
    SET count = GREATEST(0, count - 1)
    WHERE user_id = target_id;
  
  END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
