-- ============================================================
-- SPCC — Audit Log Table
-- Run this in your Supabase SQL Editor
-- ============================================================

create table if not exists public.audit_log (
  id           uuid primary key default gen_random_uuid(),
  action       text not null,        -- 'transaction_deleted' | 'transaction_edited'
  performed_by uuid references public.users(id) on delete set null,
  reason       text not null,        -- mandatory reason provided by Tabeer
  details      jsonb,                -- snapshot of original data before change
  created_at   timestamptz default now()
);

-- Enable RLS
alter table public.audit_log enable row level security;

-- Only secretary can read the audit log
create policy "audit: secretary reads all" on public.audit_log
  for select using (public.my_role() = 'secretary');

-- Any authenticated user can insert their own audit entries
create policy "audit: authenticated inserts own" on public.audit_log
  for insert with check (performed_by = auth.uid());
