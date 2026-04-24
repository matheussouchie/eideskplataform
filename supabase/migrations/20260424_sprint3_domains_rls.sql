create extension if not exists pgcrypto;

create table if not exists public.domains (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles
  add column if not exists domain_id uuid references public.domains(id) on delete restrict;

alter table public.workspaces
  add column if not exists domain_id uuid references public.domains(id) on delete restrict;

alter table public.workspace_memberships
  add column if not exists domain_id uuid references public.domains(id) on delete restrict;

alter table public.departments
  add column if not exists domain_id uuid references public.domains(id) on delete restrict;

alter table public.teams
  add column if not exists domain_id uuid references public.domains(id) on delete restrict;

alter table public.tickets
  add column if not exists domain_id uuid references public.domains(id) on delete restrict;

alter table public.ticket_comments
  add column if not exists domain_id uuid references public.domains(id) on delete restrict;

create index if not exists idx_profiles_domain on public.profiles(domain_id);
create index if not exists idx_workspaces_domain on public.workspaces(domain_id);
create index if not exists idx_memberships_domain on public.workspace_memberships(domain_id);
create index if not exists idx_departments_domain on public.departments(domain_id);
create index if not exists idx_teams_domain on public.teams(domain_id);
create index if not exists idx_tickets_domain on public.tickets(domain_id);
create index if not exists idx_ticket_comments_domain on public.ticket_comments(domain_id);

insert into public.domains (name)
select distinct lower(replace(w.slug, '-', '_'))
from public.workspaces w
where not exists (
  select 1
  from public.domains d
  where d.name = lower(replace(w.slug, '-', '_'))
);

update public.workspaces workspace_row
set domain_id = domain_row.id
from public.domains domain_row
where workspace_row.domain_id is null
  and domain_row.name = lower(replace(workspace_row.slug, '-', '_'));

update public.profiles profile_row
set domain_id = membership_domain.domain_id
from (
  select distinct on (wm.user_id)
    wm.user_id,
    w.domain_id
  from public.workspace_memberships wm
  join public.workspaces w
    on w.id = wm.workspace_id
  where w.domain_id is not null
  order by wm.user_id, wm.created_at asc
) as membership_domain
where profile_row.id = membership_domain.user_id
  and profile_row.domain_id is null;

update public.workspace_memberships membership_row
set domain_id = workspace_row.domain_id
from public.workspaces workspace_row
where membership_row.workspace_id = workspace_row.id
  and membership_row.domain_id is null;

update public.departments department_row
set domain_id = workspace_row.domain_id
from public.workspaces workspace_row
where department_row.workspace_id = workspace_row.id
  and department_row.domain_id is null;

update public.teams team_row
set domain_id = department_row.domain_id
from public.departments department_row
where team_row.department_id = department_row.id
  and team_row.domain_id is null;

update public.tickets ticket_row
set domain_id = workspace_row.domain_id
from public.workspaces workspace_row
where ticket_row.workspace_id = workspace_row.id
  and ticket_row.domain_id is null;

update public.ticket_comments comment_row
set domain_id = ticket_row.domain_id
from public.tickets ticket_row
where comment_row.ticket_id = ticket_row.id
  and comment_row.domain_id is null;

alter table public.profiles
  alter column domain_id set not null;

alter table public.workspaces
  alter column domain_id set not null;

alter table public.workspace_memberships
  alter column domain_id set not null;

alter table public.departments
  alter column domain_id set not null;

alter table public.teams
  alter column domain_id set not null;

alter table public.tickets
  alter column domain_id set not null;

alter table public.ticket_comments
  alter column domain_id set not null;

create or replace function public.current_domain_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.domain_id
  from public.profiles p
  where p.id = auth.uid()
  limit 1;
$$;

create or replace function public.is_domain_member(domain_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.domain_id = domain_uuid
  );
$$;

create or replace function public.handle_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  generated_domain_name text;
  created_domain_id uuid;
begin
  generated_domain_name := lower(
    regexp_replace(
      coalesce(split_part(new.email, '@', 1), 'tenant') || '_' || substring(new.id::text from 1 for 8),
      '[^a-z0-9_]+',
      '',
      'g'
    )
  );

  insert into public.domains (name)
  values (generated_domain_name)
  on conflict (name) do update
  set name = excluded.name
  returning id into created_domain_id;

  insert into public.profiles (id, full_name, avatar_url, domain_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'avatar_url',
    created_domain_id
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url,
    domain_id = coalesce(public.profiles.domain_id, excluded.domain_id),
    updated_at = timezone('utc', now());

  return new;
end;
$$;

create or replace function public.validate_domain_consistency()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  workspace_domain uuid;
  team_domain uuid;
  department_domain uuid;
begin
  if tg_table_name = 'workspaces' then
    return new;
  end if;

  if tg_table_name = 'workspace_memberships' then
    select w.domain_id into workspace_domain
    from public.workspaces w
    where w.id = new.workspace_id;

    if workspace_domain is null or workspace_domain <> new.domain_id then
      raise exception 'Membership deve usar o mesmo domain do workspace.';
    end if;

    return new;
  end if;

  if tg_table_name = 'departments' then
    select w.domain_id into workspace_domain
    from public.workspaces w
    where w.id = new.workspace_id;

    if workspace_domain is null or workspace_domain <> new.domain_id then
      raise exception 'Departamento deve usar o mesmo domain do workspace.';
    end if;

    return new;
  end if;

  if tg_table_name = 'teams' then
    select d.domain_id into department_domain
    from public.departments d
    where d.id = new.department_id;

    if department_domain is null or department_domain <> new.domain_id then
      raise exception 'Time deve usar o mesmo domain do departamento.';
    end if;

    return new;
  end if;

  if tg_table_name = 'tickets' then
    select w.domain_id into workspace_domain
    from public.workspaces w
    where w.id = new.workspace_id;

    select t.domain_id into team_domain
    from public.teams t
    where t.id = new.team_id;

    select d.domain_id into department_domain
    from public.departments d
    where d.id = new.department_id;

    if new.domain_id <> workspace_domain or new.domain_id <> team_domain or new.domain_id <> department_domain then
      raise exception 'Ticket deve usar o mesmo domain do workspace, team e department.';
    end if;

    return new;
  end if;

  if tg_table_name = 'ticket_comments' then
    select t.domain_id into workspace_domain
    from public.tickets t
    where t.id = new.ticket_id;

    if workspace_domain is null or workspace_domain <> new.domain_id then
      raise exception 'Mensagem do ticket deve usar o mesmo domain do ticket.';
    end if;

    return new;
  end if;

  if tg_table_name = 'profiles' then
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists validate_membership_domain_consistency on public.workspace_memberships;
create trigger validate_membership_domain_consistency
before insert or update on public.workspace_memberships
for each row execute procedure public.validate_domain_consistency();

drop trigger if exists validate_department_domain_consistency on public.departments;
create trigger validate_department_domain_consistency
before insert or update on public.departments
for each row execute procedure public.validate_domain_consistency();

drop trigger if exists validate_team_domain_consistency on public.teams;
create trigger validate_team_domain_consistency
before insert or update on public.teams
for each row execute procedure public.validate_domain_consistency();

drop trigger if exists validate_ticket_domain_consistency on public.tickets;
create trigger validate_ticket_domain_consistency
before insert or update on public.tickets
for each row execute procedure public.validate_domain_consistency();

drop trigger if exists validate_ticket_comment_domain_consistency on public.ticket_comments;
create trigger validate_ticket_comment_domain_consistency
before insert or update on public.ticket_comments
for each row execute procedure public.validate_domain_consistency();

drop policy if exists "profiles_select_self" on public.profiles;
create policy "profiles_select_self"
on public.profiles
for select
to authenticated
using (domain_id = public.current_domain_id());

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (id = auth.uid() and domain_id = public.current_domain_id())
with check (id = auth.uid() and domain_id = public.current_domain_id());

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles
for insert
to authenticated
with check (id = auth.uid() and domain_id = public.current_domain_id());

drop policy if exists "workspaces_select_member" on public.workspaces;
create policy "workspaces_select_member"
on public.workspaces
for select
to authenticated
using (
  public.is_domain_member(domain_id)
  and public.is_workspace_member(id)
);

drop policy if exists "workspaces_insert_authenticated" on public.workspaces;
create policy "workspaces_insert_authenticated"
on public.workspaces
for insert
to authenticated
with check (
  created_by = auth.uid()
  and domain_id = public.current_domain_id()
);

drop policy if exists "workspaces_update_admin" on public.workspaces;
create policy "workspaces_update_admin"
on public.workspaces
for update
to authenticated
using (
  domain_id = public.current_domain_id()
  and public.workspace_user_role(id) in ('owner', 'admin')
)
with check (
  domain_id = public.current_domain_id()
  and public.workspace_user_role(id) in ('owner', 'admin')
);

drop policy if exists "memberships_select_member" on public.workspace_memberships;
create policy "memberships_select_member"
on public.workspace_memberships
for select
to authenticated
using (
  domain_id = public.current_domain_id()
  and public.is_workspace_member(workspace_id)
);

drop policy if exists "memberships_insert_owner_self" on public.workspace_memberships;
create policy "memberships_insert_owner_self"
on public.workspace_memberships
for insert
to authenticated
with check (
  domain_id = public.current_domain_id()
  and (
    (
      user_id = auth.uid()
      and role = 'owner'
      and exists (
        select 1
        from public.workspaces w
        where w.id = workspace_id
          and w.created_by = auth.uid()
          and w.domain_id = public.current_domain_id()
      )
    )
    or (
      public.workspace_user_role(workspace_id) in ('owner', 'admin')
      and role in ('admin', 'agent', 'requester')
    )
  )
);

drop policy if exists "memberships_update_admin" on public.workspace_memberships;
create policy "memberships_update_admin"
on public.workspace_memberships
for update
to authenticated
using (
  domain_id = public.current_domain_id()
  and public.workspace_user_role(workspace_id) in ('owner', 'admin')
)
with check (
  domain_id = public.current_domain_id()
  and public.workspace_user_role(workspace_id) in ('owner', 'admin')
);

drop policy if exists "tickets_select_member" on public.tickets;
create policy "tickets_select_member"
on public.tickets
for select
to authenticated
using (
  domain_id = public.current_domain_id()
  and public.is_workspace_member(workspace_id)
);

drop policy if exists "tickets_insert_member" on public.tickets;
create policy "tickets_insert_member"
on public.tickets
for insert
to authenticated
with check (
  domain_id = public.current_domain_id()
  and public.is_workspace_member(workspace_id)
  and requester_id = auth.uid()
);

drop policy if exists "tickets_update_agent" on public.tickets;
create policy "tickets_update_agent"
on public.tickets
for update
to authenticated
using (
  domain_id = public.current_domain_id()
  and public.is_workspace_member(workspace_id)
  and public.workspace_user_role(workspace_id) in ('owner', 'admin', 'agent')
)
with check (
  domain_id = public.current_domain_id()
  and public.is_workspace_member(workspace_id)
  and public.workspace_user_role(workspace_id) in ('owner', 'admin', 'agent')
);

drop policy if exists "comments_select_member" on public.ticket_comments;
create policy "comments_select_member"
on public.ticket_comments
for select
to authenticated
using (
  domain_id = public.current_domain_id()
  and public.is_workspace_member(workspace_id)
);

drop policy if exists "comments_insert_member" on public.ticket_comments;
create policy "comments_insert_member"
on public.ticket_comments
for insert
to authenticated
with check (
  domain_id = public.current_domain_id()
  and public.is_workspace_member(workspace_id)
  and author_id = auth.uid()
);

drop policy if exists "departments_select_member" on public.departments;
create policy "departments_select_member"
on public.departments
for select
to authenticated
using (
  domain_id = public.current_domain_id()
  and public.is_workspace_member(workspace_id)
);

drop policy if exists "departments_insert_admin" on public.departments;
create policy "departments_insert_admin"
on public.departments
for insert
to authenticated
with check (
  domain_id = public.current_domain_id()
  and public.is_workspace_member(workspace_id)
  and public.workspace_user_role(workspace_id) in ('owner', 'admin')
);

drop policy if exists "departments_update_admin" on public.departments;
create policy "departments_update_admin"
on public.departments
for update
to authenticated
using (
  domain_id = public.current_domain_id()
  and public.is_workspace_member(workspace_id)
  and public.workspace_user_role(workspace_id) in ('owner', 'admin')
)
with check (
  domain_id = public.current_domain_id()
  and public.is_workspace_member(workspace_id)
  and public.workspace_user_role(workspace_id) in ('owner', 'admin')
);

drop policy if exists "teams_select_member" on public.teams;
create policy "teams_select_member"
on public.teams
for select
to authenticated
using (
  domain_id = public.current_domain_id()
  and public.is_workspace_member(workspace_id)
);

drop policy if exists "teams_insert_admin" on public.teams;
create policy "teams_insert_admin"
on public.teams
for insert
to authenticated
with check (
  domain_id = public.current_domain_id()
  and public.is_workspace_member(workspace_id)
  and public.workspace_user_role(workspace_id) in ('owner', 'admin')
);

drop policy if exists "teams_update_admin" on public.teams;
create policy "teams_update_admin"
on public.teams
for update
to authenticated
using (
  domain_id = public.current_domain_id()
  and public.is_workspace_member(workspace_id)
  and public.workspace_user_role(workspace_id) in ('owner', 'admin')
)
with check (
  domain_id = public.current_domain_id()
  and public.is_workspace_member(workspace_id)
  and public.workspace_user_role(workspace_id) in ('owner', 'admin')
);
