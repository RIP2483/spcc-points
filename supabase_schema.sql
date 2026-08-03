-- ============================================================
-- SPCC Points Tracker — Supabase Schema + RLS Policies
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- ── 1. Users table ─────────────────────────────────────────
-- Mirrors auth.users; one row per club member.
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  email       text not null unique,
  role        text not null check (role in ('committee','head','exco','secretary')),
  department  text check (department in ('events','media') or department is null),
  created_at  timestamptz not null default now()
);

-- Index for department queries (head lookups)
create index if not exists users_department_idx on public.users(department);
create index if not exists users_role_idx       on public.users(role);

-- ── 2. Point transactions table ────────────────────────────
create table if not exists public.point_transactions (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.users(id) on delete cascade,
  awarded_by  uuid references public.users(id) on delete set null,
  amount      integer not null,   -- positive = award, negative = deduction
  reason      text not null,
  category    text,               -- nullable; reserved for V2 fixed categories
  created_at  timestamptz not null default now()
);

create index if not exists pt_member_idx     on public.point_transactions(member_id);
create index if not exists pt_awarded_by_idx on public.point_transactions(awarded_by);
create index if not exists pt_created_at_idx on public.point_transactions(created_at desc);

-- ── 3. Helper function — get current user's role ────────────
create or replace function public.my_role()
returns text language sql stable security definer as $$
  select role from public.users where id = auth.uid();
$$;

-- Helper — get current user's department
create or replace function public.my_department()
returns text language sql stable security definer as $$
  select department from public.users where id = auth.uid();
$$;

-- ── 4. Enable Row Level Security ───────────────────────────
alter table public.users              enable row level security;
alter table public.point_transactions enable row level security;

-- ── 5. RLS: users table ────────────────────────────────────

-- Everyone can read their own row
create policy "users: own row" on public.users
  for select using (id = auth.uid());

-- Committee: only own row (covered by above)

-- Head: own row + committee members in same dept + exco/secretary rows
create policy "users: head sees dept + exco" on public.users
  for select using (
    public.my_role() = 'head'
    and (
      id = auth.uid()
      or (role = 'committee' and department = public.my_department())
      or role in ('exco','secretary')
      or role = 'head'   -- can see other heads too
    )
  );

-- Exco: all rows
create policy "users: exco sees all" on public.users
  for select using (public.my_role() = 'exco');

-- Secretary: all rows
create policy "users: secretary sees all" on public.users
  for select using (public.my_role() = 'secretary');

-- Only secretary can INSERT/UPDATE/DELETE user rows
create policy "users: secretary manages" on public.users
  for all using (public.my_role() = 'secretary')
  with check (public.my_role() = 'secretary');

-- ── 6. RLS: point_transactions table ──────────────────────

-- SELECT policies ─────────────────────────────────────────

-- Own transactions
create policy "pt: own transactions" on public.point_transactions
  for select using (member_id = auth.uid());

-- Head: can see transactions for own-dept committee + exco/head/secretary members
create policy "pt: head sees dept + exco" on public.point_transactions
  for select using (
    public.my_role() = 'head'
    and member_id in (
      select id from public.users
      where (role = 'committee' and department = public.my_department())
         or role in ('exco','secretary','head')
    )
  );

-- Exco: see all transactions
create policy "pt: exco sees all" on public.point_transactions
  for select using (public.my_role() = 'exco');

-- Secretary: see all transactions
create policy "pt: secretary sees all" on public.point_transactions
  for select using (public.my_role() = 'secretary');

-- INSERT policies ─────────────────────────────────────────

-- Head can insert for own-dept committee, other heads, exco, secretary (but NOT themselves)
create policy "pt: head inserts" on public.point_transactions
  for insert with check (
    public.my_role() = 'head'
    and member_id != auth.uid()
    and member_id not in (select id from public.users where role = 'secretary')
    and awarded_by = auth.uid()
    and member_id in (
      select id from public.users
      where (role = 'committee' and department = public.my_department())
         or role in ('head','exco')
    )
  );

-- Exco can insert for other exco, heads (but NOT committee, NOT secretary, NOT themselves)
create policy "pt: exco inserts" on public.point_transactions
  for insert with check (
    public.my_role() = 'exco'
    and member_id != auth.uid()
      select id from public.users where role in ('exco','head','secretary')
    )
  );

-- Secretary can insert for anyone (including themselves)
create policy "pt: secretary inserts" on public.point_transactions
  for insert with check (
    public.my_role() = 'secretary'
    and awarded_by = auth.uid()
  );

-- UPDATE policies ─────────────────────────────────────────
-- Only secretary can update transactions (to correct mistakes)
create policy "pt: secretary updates" on public.point_transactions
  for update using (public.my_role() = 'secretary')
  with check (public.my_role() = 'secretary');

-- DELETE policies ─────────────────────────────────────────
-- Only secretary can delete transactions
create policy "pt: secretary deletes" on public.point_transactions
  for delete using (public.my_role() = 'secretary');

-- ── 7. Realtime (optional) ─────────────────────────────────
-- Uncomment if you want live updates in the dashboard
-- alter publication supabase_realtime add table public.point_transactions;

-- ── 8. Seed: Tabeer (Secretary) account ────────────────────
-- After running this schema, create Tabeer's AUTH account via Supabase
-- Authentication > Users > Add user, then insert her profile row:
--
-- insert into public.users (id, name, email, role, department)
-- values ('<auth_user_id_from_dashboard>', 'Tabeer', 'tabeer@example.com', 'secretary', null);
--
-- Replace <auth_user_id_from_dashboard> with the UUID shown in Auth > Users.
