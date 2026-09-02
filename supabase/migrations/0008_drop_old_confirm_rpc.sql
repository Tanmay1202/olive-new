-- 0008_drop_old_confirm_rpc.sql
-- Drop the old 2-parameter version of confirm_booking_and_assign_units
-- that was superseded by the 3-parameter version in 0007_fix_rpc_issues.sql.
-- Postgres treats them as separate overloaded functions — the old one must be
-- explicitly dropped to prevent callers accidentally hitting the stale version
-- that hard-codes payment_status = 'paid'.
drop function if exists confirm_booking_and_assign_units(uuid, text);
