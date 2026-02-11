-- RESET SCRIPT: Restore Reveal Deadline to Valentine's Day
-- Target: Feb 14, 2026 00:00:00 IST (Midnight)
-- UTC:    Feb 13, 2026 18:30:00 UTC

CREATE OR REPLACE FUNCTION get_reveal_status()
RETURNS jsonb AS $$
BEGIN
  RETURN jsonb_build_object(
    'server_time', NOW(),
    -- Deadline: Feb 14, 2026 00:00:00 IST
    'deadline', '2026-02-13 18:30:00+00', 
    'is_revealed', false -- Hardcoded false until then, or calculate dynamically
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
