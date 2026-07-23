-- ============================================================================
-- DEBUG SCRIPT FOR RLS and current_user_id() FUNCTION
-- ============================================================================
-- This script exactly mirrors your test query with detailed debug output
-- Make sure to check PostgreSQL logs/notices for [DEBUG current_user_id] messages

-- Enable notice messages
SET client_min_messages TO NOTICE;

BEGIN;

-- Step 1: Set the config
RAISE NOTICE '========== STEP 1: Setting core.user config ==========';
SELECT set_config('core.user', '{"x-app-user-id":"37C6yuezOh2tMDfwLqmgWoKS0tD"}', true) AS config_set_result;

-- Step 2: Verify the config is actually set
RAISE NOTICE '========== STEP 2: Reading config directly (should see the JSON) ==========';
SELECT current_setting('core.user', true) AS config_value;

-- Step 3: Test current_user_id() - THIS SHOULD SHOW DEBUG MESSAGES
RAISE NOTICE '========== STEP 3: Calling core.current_user_id() - Watch for [DEBUG current_user_id] messages ==========';
SELECT core.current_user_id() AS current_user_result;

-- Step 4: Test user_has_all_permission()
RAISE NOTICE '========== STEP 4: Testing core.user_has_all_permission() ==========';
SELECT core.user_has_all_permission() AS has_all_permission;

-- Step 5: Count therapists with RLS applied
RAISE NOTICE '========== STEP 5: Querying therapists WITH RLS ==========';
SELECT count(*) as therapist_count FROM core.therapist;

-- Step 6: Show first few therapists to verify filtering
RAISE NOTICE '========== STEP 6: Sample therapists (should be filtered by RLS) ==========';
SELECT id, user_id FROM core.therapist LIMIT 5;

-- Step 7: Manual permission check for debugging
RAISE NOTICE '========== STEP 7: Manual permission lookup ==========';
SELECT user_id, key, allowed FROM core.user_permission WHERE user_id = '37C6yuezOh2tMDfwLqmgWoKS0tD';

COMMIT;

-- ============================================================================
-- INTERPRETATION GUIDE
-- ============================================================================
-- If you see:
--   current_user_result = '37C6yuezOh2tMDfwLqmgWoKS0tD' ✓ GOOD - function works
--   current_user_result = NULL ✗ BAD - session var not read or JSON parsing failed
--   therapist_count = 0 or matches your user's therapist count ✓ GOOD - RLS works
--   therapist_count = total in database ✗ BAD - RLS not filtering (returns NULL issue)
-- ============================================================================

