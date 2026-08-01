-- ============================================================
-- SPCC — Fix User Deletion Constraint
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Drop existing restricted foreign key constraint
alter table public.point_transactions
  drop constraint if exists point_transactions_awarded_by_fkey;

-- 2. Make awarded_by column nullable (so history remains intact if awarder is deleted)
alter table public.point_transactions
  alter column awarded_by drop not null;

-- 3. Add foreign key with ON DELETE SET NULL
alter table public.point_transactions
  add constraint point_transactions_awarded_by_fkey
  foreign key (awarded_by) references public.users(id) on delete set null;
