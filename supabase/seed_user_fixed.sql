-- Seed test user for development
-- Creates both auth.users and coaches records with the same UUID

do $$
declare
  new_id uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
begin
  -- Create auth user
  insert into auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  values (
    new_id,
    'josh.mann@freestylevancouver.ski',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Joshua Mann"}'
  )
  on conflict (id) do nothing;

  -- Create coach record
  insert into coaches (id, email, full_name, created_at)
  values (new_id, 'josh.mann@freestylevancouver.ski', 'Joshua Mann', now())
  on conflict (id) do nothing;
end $$;
