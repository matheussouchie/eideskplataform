create extension if not exists pgcrypto;

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, name)
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (department_id, name)
);

alter table public.profiles
  add column if not exists team_id uuid references public.teams(id) on delete set null;

alter table public.tickets
  add column if not exists department_id uuid references public.departments(id) on delete restrict,
  add column if not exists team_id uuid references public.teams(id) on delete restrict;

create index if not exists idx_departments_workspace on public.departments(workspace_id);
create index if not exists idx_teams_workspace on public.teams(workspace_id);
create index if not exists idx_teams_department on public.teams(department_id);
create index if not exists idx_profiles_team on public.profiles(team_id);
create index if not exists idx_tickets_department on public.tickets(department_id);
create index if not exists idx_tickets_team on public.tickets(team_id);

insert into public.departments (workspace_id, name)
select w.id, 'Operacoes'
from public.workspaces w
where not exists (
  select 1
  from public.departments d
  where d.workspace_id = w.id
);

insert into public.teams (workspace_id, department_id, name)
select d.workspace_id, d.id, 'Atendimento Geral'
from public.departments d
where not exists (
  select 1
  from public.teams t
  where t.department_id = d.id
);

update public.tickets ticket_row
set
  department_id = (
    select t.department_id
    from public.teams t
    where t.workspace_id = ticket_row.workspace_id
    order by t.created_at asc, t.name asc
    limit 1
  ),
  team_id = (
    select t.id
    from public.teams t
    where t.workspace_id = ticket_row.workspace_id
    order by t.created_at asc, t.name asc
    limit 1
  )
where ticket_row.team_id is null
   or ticket_row.department_id is null;

update public.profiles profile_row
set team_id = (
  select t.id
  from public.workspace_memberships membership_row
  join public.teams t
    on t.workspace_id = membership_row.workspace_id
  where membership_row.user_id = profile_row.id
    and membership_row.role in ('owner', 'admin', 'agent')
  order by membership_row.created_at asc, t.created_at asc, t.name asc
  limit 1
)
where exists (
  select 1
  from public.workspace_memberships membership_row
  where membership_row.user_id = profile_row.id
    and membership_row.role in ('owner', 'admin', 'agent')
)
  and profile_row.team_id is null;

alter table public.tickets
  alter column department_id set not null,
  alter column team_id set not null;

create or replace function public.validate_team_department_workspace()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  team_workspace_id uuid;
  team_department_id uuid;
  department_workspace_id uuid;
begin
  select t.workspace_id, t.department_id
  into team_workspace_id, team_department_id
  from public.teams t
  where t.id = new.team_id;

  if team_workspace_id is null then
    raise exception 'Time informado nao existe.';
  end if;

  select d.workspace_id
  into department_workspace_id
  from public.departments d
  where d.id = new.department_id;

  if department_workspace_id is null then
    raise exception 'Departamento informado nao existe.';
  end if;

  if new.workspace_id <> team_workspace_id or new.workspace_id <> department_workspace_id then
    raise exception 'Time e departamento devem pertencer ao mesmo workspace do ticket.';
  end if;

  if team_department_id <> new.department_id then
    raise exception 'Time deve pertencer ao departamento informado.';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_ticket_team_department_workspace on public.tickets;
create trigger validate_ticket_team_department_workspace
before insert or update on public.tickets
for each row execute procedure public.validate_team_department_workspace();

create or replace function public.validate_profile_team_workspace()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  membership_workspace_id uuid;
  team_workspace_id uuid;
begin
  if new.team_id is null then
    return new;
  end if;

  select wm.workspace_id
  into membership_workspace_id
  from public.workspace_memberships wm
  where wm.user_id = new.id
  order by wm.created_at asc
  limit 1;

  select t.workspace_id
  into team_workspace_id
  from public.teams t
  where t.id = new.team_id;

  if team_workspace_id is null then
    raise exception 'Time informado para o perfil nao existe.';
  end if;

  if membership_workspace_id is not null and membership_workspace_id <> team_workspace_id then
    raise exception 'Time do perfil deve pertencer ao mesmo workspace da membership.';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_profile_team_workspace on public.profiles;
create trigger validate_profile_team_workspace
before insert or update on public.profiles
for each row execute procedure public.validate_profile_team_workspace();

alter table public.departments enable row level security;
alter table public.teams enable row level security;

drop policy if exists "departments_select_member" on public.departments;
create policy "departments_select_member"
on public.departments
for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "departments_insert_admin" on public.departments;
create policy "departments_insert_admin"
on public.departments
for insert
to authenticated
with check (
  public.is_workspace_member(workspace_id)
  and public.workspace_user_role(workspace_id) in ('owner', 'admin')
);

drop policy if exists "departments_update_admin" on public.departments;
create policy "departments_update_admin"
on public.departments
for update
to authenticated
using (
  public.is_workspace_member(workspace_id)
  and public.workspace_user_role(workspace_id) in ('owner', 'admin')
)
with check (
  public.is_workspace_member(workspace_id)
  and public.workspace_user_role(workspace_id) in ('owner', 'admin')
);

drop policy if exists "teams_select_member" on public.teams;
create policy "teams_select_member"
on public.teams
for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "teams_insert_admin" on public.teams;
create policy "teams_insert_admin"
on public.teams
for insert
to authenticated
with check (
  public.is_workspace_member(workspace_id)
  and public.workspace_user_role(workspace_id) in ('owner', 'admin')
);

drop policy if exists "teams_update_admin" on public.teams;
create policy "teams_update_admin"
on public.teams
for update
to authenticated
using (
  public.is_workspace_member(workspace_id)
  and public.workspace_user_role(workspace_id) in ('owner', 'admin')
)
with check (
  public.is_workspace_member(workspace_id)
  and public.workspace_user_role(workspace_id) in ('owner', 'admin')
);
