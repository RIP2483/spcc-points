-- Admin password reset function
-- Only secretaries can call this. Uses pgcrypto (enabled by default in Supabase)
-- to hash the new password and update it directly in auth.users.

create or replace function public.admin_reset_user_password(target_user_id uuid, new_password text)
returns void
language plpgsql
security definer
as $$
begin
  -- Enforce: only the secretary role can call this
  if (select role from public.users where id = auth.uid()) != 'secretary' then
    raise exception 'Unauthorized: only the secretary can reset passwords';
  end if;

  -- Password must be at least 6 characters
  if length(new_password) < 6 then
    raise exception 'Password must be at least 6 characters';
  end if;

  -- Update the password in Supabase auth
  update auth.users
  set encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at = now()
  where id = target_user_id;

  if not found then
    raise exception 'User not found';
  end if;
end;
$$;

-- Only authenticated users can call it (RLS inside the function handles role check)
grant execute on function public.admin_reset_user_password(uuid, text) to authenticated;
