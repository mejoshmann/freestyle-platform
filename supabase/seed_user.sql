-- Create auth user first
insert into auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values (
  gen_random_uuid(),
  'josh.mann@freestylevancouver.ski',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Joshua Mann"}'
)
returning id;

-- Then use that returned UUID to insert into coaches
-- (Run this separately after getting the UUID from above)
-- insert into coaches (id, email, full_name, created_at)
-- values ('UUID_FROM_ABOVE', 'josh.mann@freestylevancouver.ski', 'Joshua Mann', now());
