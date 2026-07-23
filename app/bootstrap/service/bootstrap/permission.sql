-- ============================================================================
-- ROLES AND PERMISSIONS BOOTSTRAP
-- ============================================================================
-- This file defines the role-based permissions for the therapy management system.
--
-- New Roles:
-- - Admin: Full system access with "All" permission
-- - Therapist: Limited access to own therapy records and related data
--
-- Permission Enforcement:
-- - Basic CRUD permissions are enforced at the API level via the permission system
-- - Row-level filtering for "own records only" is enforced at the application layer
--   by filtering queries based on the therapist_id associated with the user
-- - For example: Therapists can only see/modify therapies where therapy.therapist_id
--   matches their therapist record, which is linked via therapist.user_id
--
-- Note: While PostgreSQL Row Level Security (RLS) could be used for additional
-- security, the current implementation relies on application-level filtering which
-- is sufficient for the current requirements and provides more flexibility.
-- ============================================================================

INSERT INTO core.role (id, name, description, created_at, created_by) VALUES ('2n8msARUmRCydEHnsGcGBjDCw3s', 'Administrator', 'Able to manage permissions and roles for people using the system', 1728363281210, '2imfnAVjkbfcwEos1LLLztn1vEP');
INSERT INTO core.role (id, name, description, created_at, created_by) VALUES ('3AdminRole000000XyZ123456', 'Admin', 'Full system access with all permissions', 1728363281210, '2imfnAVjkbfcwEos1LLLztn1vEP');
INSERT INTO core.role (id, name, description, created_at, created_by) VALUES ('3TherapistRole00XyZ123456', 'Therapist', 'Therapist role with access to own therapy records and related data', 1728363281210, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Admin role permissions - Grant full access via All permission
INSERT INTO core.permission (id, user_id, role_id, key, abilities, scope, revoke, created_at, created_by) VALUES ('3AdminPerm00000XyZ123456', null, '3AdminRole000000XyZ123456', 'All', '{All}', 2, false, 1728450730789, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Admin-specific permission for updating therapist profit sharing
INSERT INTO core.permission (id, user_id, role_id, key, abilities, scope, revoke, created_at, created_by) VALUES ('3AdminProfitShare0XyZ12345', null, '3AdminRole000000XyZ123456', 'Therapist', '{UpdateProfitSharing}', 2, false, 1736629793000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Legacy Administrator role permissions (keeping for backwards compatibility)
INSERT INTO core.permission (id, user_id, role_id, key, abilities, scope, revoke, created_at, created_by) VALUES ('2nBe7rqWncTYl0iSONizlPMSL09', null, '2n8msARUmRCydEHnsGcGBjDCw3s', 'Role', '{Autocomplete,List,Get,Create,Update,Delete}', 2, false, 1728450730789, '2imfnAVjkbfcwEos1LLLztn1vEP');
INSERT INTO core.permission (id, user_id, role_id, key, abilities, scope, revoke, created_at, created_by) VALUES ('2nBeAwnAD9ZwMrt4jvOEwypQHx0', null, '2n8msARUmRCydEHnsGcGBjDCw3s', 'Permission', '{Autocomplete,Get,List,Update,Create,Delete}', 2, false, 1728450756189, '2imfnAVjkbfcwEos1LLLztn1vEP');
INSERT INTO core.permission (id, user_id, role_id, key, abilities, scope, revoke, created_at, created_by) VALUES ('2nBeCTXA5v1nic6m5ydLejPvh9C', null, '2n8msARUmRCydEHnsGcGBjDCw3s', 'UserRole', '{Autocomplete,Get,List,Create,Update,Delete}', 2, false, 1728450768065, '2imfnAVjkbfcwEos1LLLztn1vEP');
INSERT INTO core.permission (id, user_id, role_id, key, abilities, scope, revoke, created_at, created_by) VALUES ('2nBwfCBWHldRr8cznhm7AdmCWfo', null, '2n8msARUmRCydEHnsGcGBjDCw3s', 'User', '{Autocomplete,Get,List,Create,Update,Delete,ResetUserPassword}', 2, false, 1728450768065, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Assign users to roles
INSERT INTO core.user_role(id, user_id, role_id, created_at, created_by) VALUES ('2nCGbKpbDFfwJEc7kArIxwrV5MA', '2imfnAVjkbfcwEos1LLLztn1vEP', '2n8msARUmRCydEHnsGcGBjDCw3s',  1728451220632, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Assign Admin role to admin users
INSERT INTO core.user_role(id, user_id, role_id, created_at, created_by) VALUES ('3AdminUser00000XyZ123456', '2imfnAVjkbfcwEos1LLLztn1vEP', '3AdminRole000000XyZ123456', 1728451220632, '2imfnAVjkbfcwEos1LLLztn1vEP');
INSERT INTO core.user_role(id, user_id, role_id, created_at, created_by) VALUES ('3AdminUserMartaXyZ123456', '37A2DuqbLObIGm0ntN8CSyeK1Sp', '3AdminRole000000XyZ123456', 1728451220632, '2imfnAVjkbfcwEos1LLLztn1vEP');
INSERT INTO core.user_role(id, user_id, role_id, created_at, created_by) VALUES ('3AdminUserKataXyZ1234567', '37A59voVWpAVpBwm7jdKpZn2jDx', '3AdminRole000000XyZ123456', 1728451220632, '2imfnAVjkbfcwEos1LLLztn1vEP');
INSERT INTO core.user_role(id, user_id, role_id, created_at, created_by) VALUES ('3AdminUserNatXyZ12345678', '37A9ikRTZcmhUJv0ydgEtJnnfJZ', '3AdminRole000000XyZ123456', 1728451220632, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Assign Therapist role to other therapist users
INSERT INTO core.user_role(id, user_id, role_id, created_at, created_by) VALUES ('3TherapistUser1XyZ1234567', '2therapistUser001XyZ12345', '3TherapistRole00XyZ123456', 1728451220632, '2imfnAVjkbfcwEos1LLLztn1vEP');
INSERT INTO core.user_role(id, user_id, role_id, created_at, created_by) VALUES ('3TherapistUser2XyZ1234567', '2therapistUser002XyZ98765', '3TherapistRole00XyZ123456', 1728451220632, '2imfnAVjkbfcwEos1LLLztn1vEP');
INSERT INTO core.user_role(id, user_id, role_id, created_at, created_by) VALUES ('3TherapistUser3XyZ1234567', '2therapistUser003XyZ11122', '3TherapistRole00XyZ123456', 1728451220632, '2imfnAVjkbfcwEos1LLLztn1vEP');
INSERT INTO core.user_role(id, user_id, role_id, created_at, created_by) VALUES ('3TherapistElizaXyZ123456', '37C4QrDAGfRePpSeZNIFokcvqsg', '3TherapistRole00XyZ123456', 1728451220632, '2imfnAVjkbfcwEos1LLLztn1vEP');
INSERT INTO core.user_role(id, user_id, role_id, created_at, created_by) VALUES ('3TherapistAdamHXyZ123456', '37C6yuezOh2tMDfwLqmgWoKS0tD', '3TherapistRole00XyZ123456', 1728451220632, '2imfnAVjkbfcwEos1LLLztn1vEP');
INSERT INTO core.user_role(id, user_id, role_id, created_at, created_by) VALUES ('3TherapistKingaXyZ123456', '37C7ZTHn6XnIOAAQ1pqws9dXNzT', '3TherapistRole00XyZ123456', 1728451220632, '2imfnAVjkbfcwEos1LLLztn1vEP');
INSERT INTO core.user_role(id, user_id, role_id, created_at, created_by) VALUES ('3TherapistAgniXyZ1234567', '37C875jQIRZtfdNGQN4fsaCAZyJ', '3TherapistRole00XyZ123456', 1728451220632, '2imfnAVjkbfcwEos1LLLztn1vEP');
INSERT INTO core.user_role(id, user_id, role_id, created_at, created_by) VALUES ('3TherapistKaroXyZ1234567', '37C8G2YZPQfpTrBJVDq6GvVoWsi', '3TherapistRole00XyZ123456', 1728451220632, '2imfnAVjkbfcwEos1LLLztn1vEP');
INSERT INTO core.user_role(id, user_id, role_id, created_at, created_by) VALUES ('3TherapistJoanXyZ1234567', '37C8G5G0r6cyQkPHh88qnomlqMF', '3TherapistRole00XyZ123456', 1728451220632, '2imfnAVjkbfcwEos1LLLztn1vEP');
INSERT INTO core.user_role(id, user_id, role_id, created_at, created_by) VALUES ('3TherapistIwonXyZ1234567', '37C8G2m417AQm8dODkpUoBrEyin', '3TherapistRole00XyZ123456', 1728451220632, '2imfnAVjkbfcwEos1LLLztn1vEP');
INSERT INTO core.user_role(id, user_id, role_id, created_at, created_by) VALUES ('3TherapistJustXyZ1234567', '37C8G49o4r4x9kuB7ybuRVyh1sC', '3TherapistRole00XyZ123456', 1728451220632, '2imfnAVjkbfcwEos1LLLztn1vEP');
INSERT INTO core.user_role(id, user_id, role_id, created_at, created_by) VALUES ('3TherapistAnnaSXyZ123456', '37C8G6CNhTalG7T0eO6jbDz828q', '3TherapistRole00XyZ123456', 1728451220632, '2imfnAVjkbfcwEos1LLLztn1vEP');
INSERT INTO core.user_role(id, user_id, role_id, created_at, created_by) VALUES ('3TherapistAdamKXyZ123456', '37C8G81n41hGchEibWLJ1ZHLEVT', '3TherapistRole00XyZ123456', 1728451220632, '2imfnAVjkbfcwEos1LLLztn1vEP');
INSERT INTO core.user_role(id, user_id, role_id, created_at, created_by) VALUES ('3TherapistMariaXyZ123456', '37C8G8Q8vqasz9sbg5u8y87Kfyg', '3TherapistRole00XyZ123456', 1728451220632, '2imfnAVjkbfcwEos1LLLztn1vEP');
INSERT INTO core.user_role(id, user_id, role_id, created_at, created_by) VALUES ('3TherapistAnnaStXyZ12345', '37C9YY8RNjYqXiBhEwOTjbWkHml', '3TherapistRole00XyZ123456', 1728451220632, '2imfnAVjkbfcwEos1LLLztn1vEP');
INSERT INTO core.user_role(id, user_id, role_id, created_at, created_by) VALUES ('3TherapistJuliaXyZ123456', '37C9YSjqR8w14MYeByv2UWBoTXc', '3TherapistRole00XyZ123456', 1728451220632, '2imfnAVjkbfcwEos1LLLztn1vEP');
INSERT INTO core.user_role(id, user_id, role_id, created_at, created_by) VALUES ('3TherapistAnnaRXyZ123456', '37C9YThOEVpAIMfgPLZMl2Z0aUo', '3TherapistRole00XyZ123456', 1728451220632, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Assign permissions for Therapist role
INSERT INTO core.permission (role_id, key, abilities, scope, revoke, created_at, created_by) VALUES
-- Customer - read only access for scope 1 (own customers via therapist_customer)
( '3TherapistRole00XyZ123456', 'Customer', '{Autocomplete,Get,List,Create}', 1, false, 1728450832450, '2imfnAVjkbfcwEos1LLLztn1vEP'),
-- Service - read only access for all services
( '3TherapistRole00XyZ123456', 'Service', '{Autocomplete,Get,List}', 2, false, 1728450832450, '2imfnAVjkbfcwEos1LLLztn1vEP'),
-- Session - CRUD but only for sessions assigned to their therapist record (enforced by application/RLS)
( '3TherapistRole00XyZ123456', 'Session', '{Autocomplete,Create,Get,List,Update,Delete,GetNextSession}', 1, false, 1728450832450, '2imfnAVjkbfcwEos1LLLztn1vEP'),
-- Office - read only access for all offices
( '3TherapistRole00XyZ123456', 'Office', '{Autocomplete,Get,List}', 2, false, 1728450832450, '2imfnAVjkbfcwEos1LLLztn1vEP'),
-- Room - read only access for all rooms
( '3TherapistRole00XyZ123456', 'Room', '{Autocomplete,Get,List}', 2, false, 1728450832450, '2imfnAVjkbfcwEos1LLLztn1vEP'),
-- Therapist - read and update access for their own therapist record (enforced by application/RLS)
( '3TherapistRole00XyZ123456', 'Therapist', '{Autocomplete,Get,List,Update}', 1, false, 1728450832450, '2imfnAVjkbfcwEos1LLLztn1vEP'),
-- TherapistService - read, create and update access but only linking to their own therapist record (enforced by application/RLS)
( '3TherapistRole00XyZ123456', 'TherapistService', '{Autocomplete,Create,Get,List,Update}', 1, false, 1728450832450, '2imfnAVjkbfcwEos1LLLztn1vEP'),
-- TherapistCustomer - CRUD access for their own customer links (enforced by application/RLS)
( '3TherapistRole00XyZ123456', 'TherapistCustomer', '{Autocomplete,Create,Get,List,Update,Delete}', 1, false, 1728450832450, '2imfnAVjkbfcwEos1LLLztn1vEP'),
-- Therapy - CRUD but only for therapies assigned to their therapist record (enforced by application/RLS)
( '3TherapistRole00XyZ123456', 'Therapy', '{Autocomplete,Create,Get,List,Update,Delete}', 1, false, 1728450832450, '2imfnAVjkbfcwEos1LLLztn1vEP'),
-- Availability - full access but only for their own availability (enforced by application/RLS)
( '3TherapistRole00XyZ123456', 'Availability', '{Autocomplete,Create,Get,List,Update,Delete}', 1, false, 1728450832450, '2imfnAVjkbfcwEos1LLLztn1vEP'),
-- Absence - full access but only for their own absences (enforced by application/RLS)
( '3TherapistRole00XyZ123456', 'Absence', '{Autocomplete,Create,Get,List,Update,Delete}', 1, false, 1728450832450, '2imfnAVjkbfcwEos1LLLztn1vEP'),
-- User - full access but only to their own user (enforced by application/RLS)
( '3TherapistRole00XyZ123456', 'User', '{Get,Update,List,Autocomplete,UpdateUserPassword}', 1, false, 1728450832450, '2imfnAVjkbfcwEos1LLLztn1vEP'),
-- Role - read only access
( '3TherapistRole00XyZ123456', 'Role', '{Autocomplete}', 2, false, 1728450832450, '2imfnAVjkbfcwEos1LLLztn1vEP'),
-- UserRole - read only access (enforced by application/RLS to show only own records)
( '3TherapistRole00XyZ123456', 'UserRole', '{Get,List}', 1, false, 1728450832450, '2imfnAVjkbfcwEos1LLLztn1vEP'),
( '3TherapistRole00XyZ123456', 'Permission', '{Autocomplete}', 2, false, 1728450832450, '2imfnAVjkbfcwEos1LLLztn1vEP'),
-- Language - read only access
( '3TherapistRole00XyZ123456', 'Language', '{Autocomplete,Get,List}', 2, false, 1728450832450, '2imfnAVjkbfcwEos1LLLztn1vEP'),
-- Country - read only access
( '3TherapistRole00XyZ123456', 'Country', '{Autocomplete,Get,List}', 2, false, 1728450832450, '2imfnAVjkbfcwEos1LLLztn1vEP'),
-- Notification - read only access to own audit log
( '3TherapistRole00XyZ123456', 'Notification', '{Get,List}', 1, false, 1728450832450, '2imfnAVjkbfcwEos1LLLztn1vEP'),
-- NotificationSend - send email and sms
( '3TherapistRole00XyZ123456', 'NotificationSend', '{Send}', 2, false, 1728450832450, '2imfnAVjkbfcwEos1LLLztn1vEP'),
-- NotificationTemplate - read only
( '3TherapistRole00XyZ123456', 'NotificationTemplate', '{Get,List}', 2, false, 1750521600000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
-- NotificationEventType - read only (autocomplete for template forms)
( '3TherapistRole00XyZ123456', 'NotificationEventType', '{Autocomplete,Get}', 2, false, 1750521600000, '2imfnAVjkbfcwEos1LLLztn1vEP'),
-- NotificationPreference - manage own preferences (scope 1 = own rows via RLS)
( '3TherapistRole00XyZ123456', 'NotificationPreference', '{Get,List,Update}', 1, false, 1750521600000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Admin role permissions for RecurringCashflow and Transaction
-- RecurringCashflow - Admin has full access
INSERT INTO core.permission (role_id, key, abilities, scope, revoke, created_at, created_by) VALUES
( '3AdminRole000000XyZ123456', 'RecurringCashflow', '{Autocomplete,Create,Get,List,Update,Delete}', 2, false, 1736800000000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- Transaction - Admin has full access
INSERT INTO core.permission (role_id, key, abilities, scope, revoke, created_at, created_by) VALUES
( '3AdminRole000000XyZ123456', 'Transaction', '{Autocomplete,Create,Get,List,Update,Delete}', 2, false, 1736800000000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- SystemSettings - Admin has full access (Get, Update, GetHistory)
INSERT INTO core.permission (role_id, key, abilities, scope, revoke, created_at, created_by) VALUES
( '3AdminRole000000XyZ123456', 'SystemSettings', '{Get,Update,GetHistory}', 2, false, 1736800000000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- SystemSettings - Therapist has read-only access (Get only, for timezone display)
INSERT INTO core.permission (role_id, key, abilities, scope, revoke, created_at, created_by) VALUES
( '3TherapistRole00XyZ123456', 'SystemSettings', '{Get}', 2, false, 1736800000000, '2imfnAVjkbfcwEos1LLLztn1vEP');

-- IssuesAndSuggestions - CRUD access (no deletion) for own records
INSERT INTO core.permission (role_id, key, abilities, scope, revoke, created_at, created_by) VALUES
( '3TherapistRole00XyZ123456', 'IssuesAndSuggestions', '{Autocomplete,Create,Get,List,Update}', 1, false, 1780444800000, '2imfnAVjkbfcwEos1LLLztn1vEP');

INSERT INTO core.permission (id, role_id, key, abilities, scope, revoke, created_at, created_by)
SELECT '3AdminProfitShare0XyZ12345', '3AdminRole000000XyZ123456', 'Therapist', '{UpdateProfitSharing}', 2, false, 1736629793000, '2imfnAVjkbfcwEos1LLLztn1vEP'
WHERE EXISTS (SELECT 1 FROM core.role WHERE id = '3AdminRole000000XyZ123456')
ON CONFLICT (id) DO NOTHING;
