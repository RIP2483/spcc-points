-- Leaderboard RPC: returns top 3 anonymous point totals for committee members only
-- This runs with SECURITY DEFINER so it bypasses RLS safely (no names/IDs exposed)
create or replace function public.get_leaderboard_top3()
returns table(points integer)
language sql
security definer
stable
as $$
  select
    coalesce(sum(pt.amount), 0)::integer as points
  from public.users u
  left join public.point_transactions pt
    on pt.member_id = u.id
    and pt.status = 'approved'
  where u.role = 'committee'
  group by u.id
  having coalesce(sum(pt.amount), 0) > 0
  order by points desc
  limit 3;
$$;

-- Allow all authenticated users to call this function
grant execute on function public.get_leaderboard_top3() to authenticated;
