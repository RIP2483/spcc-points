-- ============================================================
-- SPCC — RLS Fix 2: Heads can award to Exco but NOT view their points
-- Run in Supabase SQL Editor
-- ============================================================

-- Drop the policies we need to update
drop policy if exists "users: head sees dept + heads only"    on public.users;
drop policy if exists "pt: head sees dept + heads only"       on public.point_transactions;
drop policy if exists "pt: head inserts"                      on public.point_transactions;

-- Heads can see: own row, own dept committee, other heads, AND exco name/id
-- (needed so exco appears in the award-points recipient dropdown)
-- but they still CANNOT see exco's points (transaction policy below blocks that)
create policy "users: head sees dept + heads + exco names" on public.users
  for select using (
    public.my_role() = 'head'
    and (
      id = auth.uid()
      or (role = 'committee' and department = public.my_department())
      or role = 'head'
      or role = 'exco'   -- visible in dropdown only, transactions still blocked below
    )
  );

-- Heads can only VIEW transactions for own dept committee + other heads
-- Exco transactions are intentionally excluded
create policy "pt: head sees dept + heads only" on public.point_transactions
  for select using (
    public.my_role() = 'head'
    and member_id in (
      select id from public.users
      where id = auth.uid()
         or (role = 'committee' and department = public.my_department())
         or role = 'head'
      -- exco deliberately excluded: heads cannot view exco points
    )
  );

-- Heads can INSERT points for own dept committee + other heads + exco
create policy "pt: head inserts" on public.point_transactions
  for insert with check (
    public.my_role() = 'head'
    and member_id != auth.uid()
    and awarded_by = auth.uid()
    and member_id in (
      select id from public.users
      where (role = 'committee' and department = public.my_department())
         or role = 'head'
         or role = 'exco'
    )
  );
