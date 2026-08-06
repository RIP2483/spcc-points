-- ============================================================
-- SPCC — Point Request & Approval System Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Add status, reviewed_by, reviewed_at columns to point_transactions
alter table public.point_transactions
  add column if not exists status      text not null default 'approved'
    check (status in ('pending', 'approved', 'rejected')),
  add column if not exists reviewed_by uuid references public.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz;

-- 2. All EXISTING transactions stay approved (no historical data changes)
update public.point_transactions set status = 'approved' where status is null;

-- 3. Index for fast pending lookups
create index if not exists pt_status_idx on public.point_transactions(status);

-- 4. Allow Secretary to UPDATE status/reviewed_by/reviewed_at on any transaction
create policy "pt: secretary approves" on public.point_transactions
  for update using (public.my_role() = 'secretary')
  with check (public.my_role() = 'secretary');
