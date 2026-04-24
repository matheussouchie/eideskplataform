begin;

create extension if not exists pgcrypto;

do $$
declare
  workspace_uuid constant uuid := '10000000-0000-0000-0000-000000000001';
  domain_uuid constant uuid := '13000000-0000-0000-0000-000000000001';
begin
  delete from public.ticket_comments
  where workspace_id = workspace_uuid;

  delete from public.tickets
  where workspace_id = workspace_uuid;

  delete from public.workspace_memberships
  where workspace_id = workspace_uuid
     or user_id = any (
       array[
         '00000000-0000-0000-0000-000000000001',
         '00000000-0000-0000-0000-000000000002',
         '00000000-0000-0000-0000-000000000003',
         '00000000-0000-0000-0000-000000000004',
         '00000000-0000-0000-0000-000000000005',
         '00000000-0000-0000-0000-000000000006'
       ]::uuid[]
     );

  delete from public.workspaces
  where id = workspace_uuid;

  delete from public.domains
  where id = domain_uuid;

  delete from public.profiles
  where id = any (
    array[
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000002',
      '00000000-0000-0000-0000-000000000003',
      '00000000-0000-0000-0000-000000000004',
      '00000000-0000-0000-0000-000000000005',
      '00000000-0000-0000-0000-000000000006'
    ]::uuid[]
  );

  delete from auth.identities
  where user_id = any (
    array[
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000002',
      '00000000-0000-0000-0000-000000000003',
      '00000000-0000-0000-0000-000000000004',
      '00000000-0000-0000-0000-000000000005',
      '00000000-0000-0000-0000-000000000006'
    ]::uuid[]
  );

  delete from auth.users
  where id = any (
    array[
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000002',
      '00000000-0000-0000-0000-000000000003',
      '00000000-0000-0000-0000-000000000004',
      '00000000-0000-0000-0000-000000000005',
      '00000000-0000-0000-0000-000000000006'
    ]::uuid[]
  );
end $$;

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
) values
(
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'admin@eidesk.local',
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
  timezone('utc', now()) - interval '1 day',
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Camila Duarte","seed_role":"admin"}',
  false,
  timezone('utc', now()) - interval '20 days',
  timezone('utc', now()) - interval '1 day',
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
),
(
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000002',
  'authenticated',
  'authenticated',
  'agente.lucas@eidesk.local',
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
  timezone('utc', now()) - interval '2 days',
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Lucas Martins","seed_role":"agent"}',
  false,
  timezone('utc', now()) - interval '19 days',
  timezone('utc', now()) - interval '2 days',
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
),
(
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000003',
  'authenticated',
  'authenticated',
  'agente.bianca@eidesk.local',
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
  timezone('utc', now()) - interval '3 days',
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Bianca Ribeiro","seed_role":"agent"}',
  false,
  timezone('utc', now()) - interval '18 days',
  timezone('utc', now()) - interval '3 days',
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
),
(
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000004',
  'authenticated',
  'authenticated',
  'agente.rafael@eidesk.local',
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
  timezone('utc', now()) - interval '4 days',
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Rafael Gomes","seed_role":"agent"}',
  false,
  timezone('utc', now()) - interval '17 days',
  timezone('utc', now()) - interval '4 days',
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
),
(
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000005',
  'authenticated',
  'authenticated',
  'cliente.julia@acme.local',
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
  timezone('utc', now()) - interval '6 days',
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Julia Ferraz","seed_role":"client"}',
  false,
  timezone('utc', now()) - interval '16 days',
  timezone('utc', now()) - interval '6 days',
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
),
(
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000006',
  'authenticated',
  'authenticated',
  'cliente.marcos@globex.local',
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
  timezone('utc', now()) - interval '5 days',
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Marcos Leal","seed_role":"client"}',
  false,
  timezone('utc', now()) - interval '15 days',
  timezone('utc', now()) - interval '5 days',
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
) values
(
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '{"sub":"00000000-0000-0000-0000-000000000001","email":"admin@eidesk.local","email_verified":true}',
  'email',
  'admin@eidesk.local',
  timezone('utc', now()) - interval '1 day',
  timezone('utc', now()) - interval '20 days',
  timezone('utc', now()) - interval '1 day'
),
(
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',
  '{"sub":"00000000-0000-0000-0000-000000000002","email":"agente.lucas@eidesk.local","email_verified":true}',
  'email',
  'agente.lucas@eidesk.local',
  timezone('utc', now()) - interval '2 days',
  timezone('utc', now()) - interval '19 days',
  timezone('utc', now()) - interval '2 days'
),
(
  '10000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000003',
  '{"sub":"00000000-0000-0000-0000-000000000003","email":"agente.bianca@eidesk.local","email_verified":true}',
  'email',
  'agente.bianca@eidesk.local',
  timezone('utc', now()) - interval '3 days',
  timezone('utc', now()) - interval '18 days',
  timezone('utc', now()) - interval '3 days'
),
(
  '10000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000004',
  '{"sub":"00000000-0000-0000-0000-000000000004","email":"agente.rafael@eidesk.local","email_verified":true}',
  'email',
  'agente.rafael@eidesk.local',
  timezone('utc', now()) - interval '4 days',
  timezone('utc', now()) - interval '17 days',
  timezone('utc', now()) - interval '4 days'
),
(
  '10000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000005',
  '{"sub":"00000000-0000-0000-0000-000000000005","email":"cliente.julia@acme.local","email_verified":true}',
  'email',
  'cliente.julia@acme.local',
  timezone('utc', now()) - interval '6 days',
  timezone('utc', now()) - interval '16 days',
  timezone('utc', now()) - interval '6 days'
),
(
  '10000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000006',
  '{"sub":"00000000-0000-0000-0000-000000000006","email":"cliente.marcos@globex.local","email_verified":true}',
  'email',
  'cliente.marcos@globex.local',
  timezone('utc', now()) - interval '5 days',
  timezone('utc', now()) - interval '15 days',
  timezone('utc', now()) - interval '5 days'
);

insert into public.domains (id, name, created_at) values
('13000000-0000-0000-0000-000000000001', 'eidesk_demo', timezone('utc', now()) - interval '20 days')
on conflict (id) do update
set
  name = excluded.name;

insert into public.profiles (id, full_name, avatar_url, domain_id, created_at, updated_at) values
('00000000-0000-0000-0000-000000000001', 'Camila Duarte', null, '13000000-0000-0000-0000-000000000001', timezone('utc', now()) - interval '20 days', timezone('utc', now()) - interval '1 day'),
('00000000-0000-0000-0000-000000000002', 'Lucas Martins', null, '13000000-0000-0000-0000-000000000001', timezone('utc', now()) - interval '19 days', timezone('utc', now()) - interval '2 days'),
('00000000-0000-0000-0000-000000000003', 'Bianca Ribeiro', null, '13000000-0000-0000-0000-000000000001', timezone('utc', now()) - interval '18 days', timezone('utc', now()) - interval '3 days'),
('00000000-0000-0000-0000-000000000004', 'Rafael Gomes', null, '13000000-0000-0000-0000-000000000001', timezone('utc', now()) - interval '17 days', timezone('utc', now()) - interval '4 days'),
('00000000-0000-0000-0000-000000000005', 'Julia Ferraz', null, '13000000-0000-0000-0000-000000000001', timezone('utc', now()) - interval '16 days', timezone('utc', now()) - interval '6 days'),
('00000000-0000-0000-0000-000000000006', 'Marcos Leal', null, '13000000-0000-0000-0000-000000000001', timezone('utc', now()) - interval '15 days', timezone('utc', now()) - interval '5 days')
on conflict (id) do update
set
  full_name = excluded.full_name,
  avatar_url = excluded.avatar_url,
  domain_id = excluded.domain_id,
  updated_at = excluded.updated_at;

insert into public.workspaces (id, domain_id, name, slug, created_by, created_at, updated_at) values
('10000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', 'EiDesk Operacoes Demo', 'eidesk-operacoes-demo', '00000000-0000-0000-0000-000000000001', timezone('utc', now()) - interval '14 days', timezone('utc', now()) - interval '1 day');

insert into public.workspace_memberships (workspace_id, user_id, domain_id, role, created_at) values
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', 'admin', timezone('utc', now()) - interval '14 days'),
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '13000000-0000-0000-0000-000000000001', 'agent', timezone('utc', now()) - interval '14 days'),
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', '13000000-0000-0000-0000-000000000001', 'agent', timezone('utc', now()) - interval '13 days'),
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', '13000000-0000-0000-0000-000000000001', 'agent', timezone('utc', now()) - interval '13 days'),
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', '13000000-0000-0000-0000-000000000001', 'requester', timezone('utc', now()) - interval '12 days'),
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006', '13000000-0000-0000-0000-000000000001', 'requester', timezone('utc', now()) - interval '12 days');

insert into public.departments (id, workspace_id, domain_id, name, created_at) values
('11000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', 'Suporte', timezone('utc', now()) - interval '14 days'),
('11000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', 'Produto', timezone('utc', now()) - interval '13 days')
on conflict (id) do update
set
  workspace_id = excluded.workspace_id,
  domain_id = excluded.domain_id,
  name = excluded.name;

insert into public.teams (id, workspace_id, department_id, domain_id, name, created_at) values
('12000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', 'Atendimento Plataforma', timezone('utc', now()) - interval '14 days'),
('12000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', 'Customer Success', timezone('utc', now()) - interval '13 days'),
('12000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000002', '13000000-0000-0000-0000-000000000001', 'Operacoes de Produto', timezone('utc', now()) - interval '12 days')
on conflict (id) do update
set
  workspace_id = excluded.workspace_id,
  department_id = excluded.department_id,
  domain_id = excluded.domain_id,
  name = excluded.name;

update public.profiles
set team_id = (
  case id
  when '00000000-0000-0000-0000-000000000001' then '12000000-0000-0000-0000-000000000001'
  when '00000000-0000-0000-0000-000000000002' then '12000000-0000-0000-0000-000000000001'
  when '00000000-0000-0000-0000-000000000003' then '12000000-0000-0000-0000-000000000002'
  when '00000000-0000-0000-0000-000000000004' then '12000000-0000-0000-0000-000000000003'
  else null
  end
)::uuid
where id in (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000006'
);

insert into public.tickets (
  id,
  workspace_id,
  requester_id,
  assignee_id,
  title,
  description,
  domain_id,
  department_id,
  team_id,
  status,
  priority,
  created_at,
  updated_at
) values
(
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000002',
  'Nao consigo acessar o dashboard apos o login',
  'Ao entrar com email e senha o sistema volta para a tela inicial. O problema acontece no notebook do financeiro desde ontem.',
  '13000000-0000-0000-0000-000000000001',
  '11000000-0000-0000-0000-000000000001',
  '12000000-0000-0000-0000-000000000001',
  'open',
  'high',
  timezone('utc', now()) - interval '10 days',
  timezone('utc', now()) - interval '9 days'
),
(
  '20000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000003',
  'Erro ao anexar comprovante no ticket',
  'O upload falha sempre que tento enviar um PDF de mais de 3 MB para complementar a solicitacao.',
  '13000000-0000-0000-0000-000000000001',
  '11000000-0000-0000-0000-000000000001',
  '12000000-0000-0000-0000-000000000002',
  'in_progress',
  'medium',
  timezone('utc', now()) - interval '9 days',
  timezone('utc', now()) - interval '3 days'
),
(
  '20000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000004',
  'Solicitacao de novo agente para o turno da noite',
  'Precisamos cadastrar mais um agente para cobrir atendimento entre 18h e 22h a partir da proxima semana.',
  '13000000-0000-0000-0000-000000000001',
  '11000000-0000-0000-0000-000000000002',
  '12000000-0000-0000-0000-000000000003',
  'resolved',
  'medium',
  timezone('utc', now()) - interval '8 days',
  timezone('utc', now()) - interval '2 days'
),
(
  '20000000-0000-0000-0000-000000000004',
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000002',
  'Fila de tickets aparece vazia no navegador Edge',
  'No Microsoft Edge a lista fica em branco, mas no Chrome funciona normalmente.',
  '13000000-0000-0000-0000-000000000001',
  '11000000-0000-0000-0000-000000000001',
  '12000000-0000-0000-0000-000000000001',
  'closed',
  'low',
  timezone('utc', now()) - interval '8 days',
  timezone('utc', now()) - interval '1 day'
),
(
  '20000000-0000-0000-0000-000000000005',
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000003',
  'Troca de senha nao envia email',
  'Usuarios novos estao clicando em recuperar senha, mas o email nao chega na caixa de entrada.',
  '13000000-0000-0000-0000-000000000001',
  '11000000-0000-0000-0000-000000000001',
  '12000000-0000-0000-0000-000000000002',
  'open',
  'urgent',
  timezone('utc', now()) - interval '7 days',
  timezone('utc', now()) - interval '6 days'
),
(
  '20000000-0000-0000-0000-000000000006',
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000004',
  'Campos do formulario cortando em tela pequena',
  'No celular Android os campos de descricao e prioridade ficam desalinhados e parte do botao some.',
  '13000000-0000-0000-0000-000000000001',
  '11000000-0000-0000-0000-000000000002',
  '12000000-0000-0000-0000-000000000003',
  'in_progress',
  'medium',
  timezone('utc', now()) - interval '6 days',
  timezone('utc', now()) - interval '1 day'
),
(
  '20000000-0000-0000-0000-000000000007',
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000005',
  null,
  'Sugestao de adicionar filtro por prioridade',
  'Seria util filtrar a fila por prioridade para o time operacional responder incidentes urgentes primeiro.',
  '13000000-0000-0000-0000-000000000001',
  '11000000-0000-0000-0000-000000000001',
  '12000000-0000-0000-0000-000000000001',
  'open',
  'low',
  timezone('utc', now()) - interval '5 days',
  timezone('utc', now()) - interval '5 days'
),
(
  '20000000-0000-0000-0000-000000000008',
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000002',
  'Duplicidade de notificacoes por email',
  'Ao responder um ticket, o cliente recebe duas notificacoes iguais em menos de um minuto.',
  '13000000-0000-0000-0000-000000000001',
  '11000000-0000-0000-0000-000000000001',
  '12000000-0000-0000-0000-000000000001',
  'resolved',
  'high',
  timezone('utc', now()) - interval '4 days',
  timezone('utc', now()) - interval '12 hours'
),
(
  '20000000-0000-0000-0000-000000000009',
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000003',
  'Permissao insuficiente para editar workspace',
  'Mesmo com perfil de administracao nao estou conseguindo alterar o nome do workspace nas configuracoes.',
  '13000000-0000-0000-0000-000000000001',
  '11000000-0000-0000-0000-000000000001',
  '12000000-0000-0000-0000-000000000002',
  'closed',
  'high',
  timezone('utc', now()) - interval '3 days',
  timezone('utc', now()) - interval '10 hours'
),
(
  '20000000-0000-0000-0000-000000000010',
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000004',
  'Dashboard demora para abrir na primeira carga',
  'Depois do login, o dashboard leva cerca de 8 segundos para mostrar a fila e os indicadores.',
  '13000000-0000-0000-0000-000000000001',
  '11000000-0000-0000-0000-000000000002',
  '12000000-0000-0000-0000-000000000003',
  'in_progress',
  'medium',
  timezone('utc', now()) - interval '2 days',
  timezone('utc', now()) - interval '2 hours'
);

insert into public.ticket_comments (
  id,
  ticket_id,
  workspace_id,
  domain_id,
  author_id,
  body,
  internal,
  created_at
) values
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 'Abri o chamado apos testar em duas maquinas diferentes e o comportamento foi o mesmo.', false, timezone('utc', now()) - interval '10 days' + interval '20 minutes'),
('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Recebi o caso e estou verificando o fluxo de redirecionamento apos autenticacao.', false, timezone('utc', now()) - interval '9 days' + interval '1 hour'),
('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006', 'Testei com PDF e imagem. A falha acontece apenas com arquivos maiores.', false, timezone('utc', now()) - interval '9 days' + interval '35 minutes'),
('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'Consegui reproduzir. Vou ajustar a validacao do upload e retorno aqui com o teste.', false, timezone('utc', now()) - interval '8 days' + interval '2 hours'),
('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 'Precisamos desse acesso antes de segunda-feira para nao sobrecarregar a equipe atual.', false, timezone('utc', now()) - interval '8 days' + interval '10 minutes'),
('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'Cadastro solicitado foi provisionado e o novo agente ja consegue acessar o ambiente.', false, timezone('utc', now()) - interval '2 days' + interval '50 minutes'),
('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006', 'No Edge eu fico com a tela em branco logo apos abrir a fila de tickets.', false, timezone('utc', now()) - interval '8 days' + interval '15 minutes'),
('30000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Aplicamos uma correcao de compatibilidade e agora a lista voltou a renderizar normalmente no Edge.', false, timezone('utc', now()) - interval '1 day' + interval '1 hour'),
('30000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 'Testamos com tres usuarios novos hoje de manha e nenhum recebeu o email de redefinicao.', false, timezone('utc', now()) - interval '7 days' + interval '25 minutes'),
('30000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'Estou analisando a configuracao do provedor de email e confirmando se houve bloqueio por reputacao.', false, timezone('utc', now()) - interval '6 days' + interval '1 hour'),
('30000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006', 'Em telas menores o botao de envio fica parcialmente escondido abaixo da dobra.', false, timezone('utc', now()) - interval '6 days' + interval '30 minutes'),
('30000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'Ajustei o layout responsivo em homologacao. Se estiver ok no seu aparelho, encerramos o caso.', false, timezone('utc', now()) - interval '1 day' + interval '40 minutes'),
('30000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 'Hoje a equipe precisa abrir cada ticket para entender a prioridade, o que atrasa o atendimento.', false, timezone('utc', now()) - interval '5 days' + interval '15 minutes'),
('30000000-0000-0000-0000-000000000014', '20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Sugestao recebida. Vamos manter na fila de melhorias para a proxima sprint funcional.', false, timezone('utc', now()) - interval '4 days' + interval '2 hours'),
('30000000-0000-0000-0000-000000000015', '20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006', 'Recebi duas copias do mesmo email ao responder o ticket 874.', false, timezone('utc', now()) - interval '4 days' + interval '45 minutes'),
('30000000-0000-0000-0000-000000000016', '20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'A duplicidade foi reproduzida e a regra de disparo foi corrigida. Pode validar novamente, por favor?', false, timezone('utc', now()) - interval '12 hours'),
('30000000-0000-0000-0000-000000000017', '20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 'Mesmo com papel de administracao, o formulario abre bloqueado para edicao.', false, timezone('utc', now()) - interval '3 days' + interval '20 minutes'),
('30000000-0000-0000-0000-000000000018', '20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'Corrigimos o mapeamento de permissoes e o workspace voltou a aceitar edicao por administradores.', false, timezone('utc', now()) - interval '10 hours'),
('30000000-0000-0000-0000-000000000019', '20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006', 'A lentidao acontece principalmente no primeiro acesso do dia, antes de a equipe comecar a usar.', false, timezone('utc', now()) - interval '2 days' + interval '20 minutes'),
('30000000-0000-0000-0000-000000000020', '20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'Estamos medindo a consulta inicial e avaliando reduzir o tempo da primeira renderizacao do dashboard.', false, timezone('utc', now()) - interval '2 hours');

update public.tickets
set
  department_id = (
    case id
    when '20000000-0000-0000-0000-000000000001' then '11000000-0000-0000-0000-000000000001'
    when '20000000-0000-0000-0000-000000000002' then '11000000-0000-0000-0000-000000000001'
    when '20000000-0000-0000-0000-000000000003' then '11000000-0000-0000-0000-000000000002'
    when '20000000-0000-0000-0000-000000000004' then '11000000-0000-0000-0000-000000000001'
    when '20000000-0000-0000-0000-000000000005' then '11000000-0000-0000-0000-000000000001'
    when '20000000-0000-0000-0000-000000000006' then '11000000-0000-0000-0000-000000000002'
    when '20000000-0000-0000-0000-000000000007' then '11000000-0000-0000-0000-000000000001'
    when '20000000-0000-0000-0000-000000000008' then '11000000-0000-0000-0000-000000000001'
    when '20000000-0000-0000-0000-000000000009' then '11000000-0000-0000-0000-000000000001'
    when '20000000-0000-0000-0000-000000000010' then '11000000-0000-0000-0000-000000000002'
    else department_id
    end
  )::uuid,
  team_id = (
    case id
    when '20000000-0000-0000-0000-000000000001' then '12000000-0000-0000-0000-000000000001'
    when '20000000-0000-0000-0000-000000000002' then '12000000-0000-0000-0000-000000000002'
    when '20000000-0000-0000-0000-000000000003' then '12000000-0000-0000-0000-000000000003'
    when '20000000-0000-0000-0000-000000000004' then '12000000-0000-0000-0000-000000000001'
    when '20000000-0000-0000-0000-000000000005' then '12000000-0000-0000-0000-000000000002'
    when '20000000-0000-0000-0000-000000000006' then '12000000-0000-0000-0000-000000000003'
    when '20000000-0000-0000-0000-000000000007' then '12000000-0000-0000-0000-000000000001'
    when '20000000-0000-0000-0000-000000000008' then '12000000-0000-0000-0000-000000000001'
    when '20000000-0000-0000-0000-000000000009' then '12000000-0000-0000-0000-000000000002'
    when '20000000-0000-0000-0000-000000000010' then '12000000-0000-0000-0000-000000000003'
    else team_id
    end
  )::uuid
where workspace_id = '10000000-0000-0000-0000-000000000001';

commit;
