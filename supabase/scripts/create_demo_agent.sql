begin;

create extension if not exists pgcrypto;

delete from public.workspace_memberships
where workspace_id = '10000000-0000-0000-0000-000000000001'
  and user_id = '00000000-0000-0000-0000-000000000007';

delete from public.profiles
where id = '00000000-0000-0000-0000-000000000007';

delete from auth.identities
where user_id = '00000000-0000-0000-0000-000000000007';

delete from auth.users
where id = '00000000-0000-0000-0000-000000000007';

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000007',
  'authenticated',
  'authenticated',
  'agente.sprint4@eidesk.local',
  crypt('Eidesk@123', gen_salt('bf')),
  timezone('utc', now()),
  null,
  '',
  null,
  '',
  null,
  '',
  '',
  null,
  timezone('utc', now()),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Agente Sprint Quatro","seed_role":"agent"}',
  false,
  timezone('utc', now()) - interval '1 hour',
  timezone('utc', now()),
  null,
  null,
  '',
  '',
  null,
  '',
  0,
  null,
  '',
  null,
  false,
  null
);

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) values (
  '10000000-0000-0000-0000-000000000007',
  '00000000-0000-0000-0000-000000000007',
  '{"sub":"00000000-0000-0000-0000-000000000007","email":"agente.sprint4@eidesk.local","email_verified":true}',
  'email',
  'agente.sprint4@eidesk.local',
  timezone('utc', now()),
  timezone('utc', now()) - interval '1 hour',
  timezone('utc', now())
);

insert into public.profiles (
  id,
  full_name,
  avatar_url,
  domain_id,
  is_active,
  team_id,
  created_at,
  updated_at
) values (
  '00000000-0000-0000-0000-000000000007',
  'Agente Sprint Quatro',
  null,
  '13000000-0000-0000-0000-000000000001',
  true,
  '12000000-0000-0000-0000-000000000001',
  timezone('utc', now()) - interval '1 hour',
  timezone('utc', now())
)
on conflict (id) do update
set
  full_name = excluded.full_name,
  avatar_url = excluded.avatar_url,
  domain_id = excluded.domain_id,
  is_active = excluded.is_active,
  team_id = excluded.team_id,
  updated_at = excluded.updated_at;

insert into public.workspace_memberships (
  workspace_id,
  user_id,
  domain_id,
  role,
  created_at
) values (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000007',
  '13000000-0000-0000-0000-000000000001',
  'agent',
  timezone('utc', now())
)
on conflict (workspace_id, user_id) do update
set
  domain_id = excluded.domain_id,
  role = excluded.role;

commit;
