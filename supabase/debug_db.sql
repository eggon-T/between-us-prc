-- Debug Script: List all Triggers and Functions
-- Run this in Supabase SQL Editor and share the output (JSON or CSV)

-- 1. List Triggers on auth.users and public.users
SELECT 
    event_object_schema as table_schema,
    event_object_table as table_name,
    trigger_name,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'users'
ORDER BY event_object_schema, event_object_table;

-- 2. List all Public Functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION';
