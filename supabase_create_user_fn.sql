-- ============================================================
-- SPCC — Admin Create User Function
-- Run this in your Supabase SQL Editor
-- ============================================================
-- Creates a new auth.users entry directly (no service role key needed).
-- Only the secretary role can call this.
-- Requires pgcrypto (enabled by default in Supabase).

create or replace function public.admin_create_user(
  p_email    text,
  p_password text
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_uid uuid;
begin
  -- Only secretary can call this
  if (select role from public.users where id = auth.uid()) != 'secretary' then
    raise exception 'Unauthorized: only the secretary can create users';
  end if;

  if length(p_password) < 8 then
    raise exception 'Password must be at least 8 characters';
  end if;

  -- Check if email already exists in auth.users
  if exists (select 1 from auth.users where email = lower(trim(p_email))) then
    raise exception 'A user with this email already exists';
  end if;

  v_uid := gen_random_uuid();

  insert into auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    created_at,
    updated_at
  ) values (
    v_uid,
    lower(trim(p_email)),
    crypt(p_password, gen_salt('bf')),
    now(),                                          -- mark as confirmed immediately
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    'authenticated',
    'authenticated',
    now(),
    now()
  );

  return v_uid;
end;
$$;

-- Allow any authenticated user to call it
-- (the secretary check is enforced inside the function)
grant execute on function public.admin_create_user(text, text) to authenticated;
