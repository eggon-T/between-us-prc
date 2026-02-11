-- TEST SCRIPT: Set Reveal Deadline to 2:55 AM IST Today
-- 2:55 AM IST (Feb 12) = 21:25 UTC (Feb 11)

CREATE OR REPLACE FUNCTION get_reveal_status()
RETURNS jsonb AS $$
DECLARE
  -- Target: 2026-02-12 02:55:00 IST
  -- UTC:    2026-02-11 21:25:00 UTC
  deadline TIMESTAMPTZ := '2026-02-11 21:25:00+00'; 
  now_time TIMESTAMPTZ := NOW();
  is_revealed BOOLEAN := now_time >= deadline;
BEGIN
  RETURN jsonb_build_object(
    'server_time', now_time,
    'deadline', deadline,
    'is_revealed', is_revealed
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
