create extension if not exists pgcrypto;

create or replace function public.is_domain_admin(domain_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_memberships wm
    join public.workspaces w
      on w.id = wm.workspace_id
    where wm.user_id = auth.uid()
      and wm.role in ('owner', 'admin')
      and w.domain_id = domain_uuid
  );
$$;

create or replace function public.provision_workspace_agent(
  agent_user_id uuid,
  workspace_uuid uuid,
  team_uuid uuid,
  agent_full_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  workspace_domain uuid;
  team_domain uuid;
begin
  if public.workspace_user_role(workspace_uuid) not in ('owner', 'admin') then
    raise exception 'Sem permissao para provisionar agente neste workspace.';
  end if;

  select w.domain_id
  into workspace_domain
  from public.workspaces w
  where w.id = workspace_uuid;

  if workspace_domain is null then
    raise exception 'Workspace informado nao existe.';
  end if;

  select t.domain_id
  into team_domain
  from public.teams t
  where t.id = team_uuid
    and t.workspace_id = workspace_uuid;

  if team_domain is null or team_domain <> workspace_domain then
    raise exception 'Time informado nao pertence ao workspace selecionado.';
  end if;

  insert into public.profiles (id, full_name, domain_id, is_active, team_id)
  values (agent_user_id, agent_full_name, workspace_domain, true, team_uuid)
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    domain_id = workspace_domain,
    is_active = true,
    team_id = team_uuid,
    updated_at = timezone('utc', now());

  insert into public.workspace_memberships (workspace_id, user_id, domain_id, role)
  values (workspace_uuid, agent_user_id, workspace_domain, 'agent')
  on conflict (workspace_id, user_id) do update
  set
    domain_id = excluded.domain_id,
    role = 'agent';
end;
$$;

create or replace function public.update_workspace_agent(
  agent_user_id uuid,
  workspace_uuid uuid,
  team_uuid uuid,
  active boolean,
  agent_full_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  workspace_domain uuid;
  team_domain uuid;
begin
  if public.workspace_user_role(workspace_uuid) not in ('owner', 'admin') then
    raise exception 'Sem permissao para editar agente neste workspace.';
  end if;

  select w.domain_id
  into workspace_domain
  from public.workspaces w
  where w.id = workspace_uuid;

  if workspace_domain is null then
    raise exception 'Workspace informado nao existe.';
  end if;

  select t.domain_id
  into team_domain
  from public.teams t
  where t.id = team_uuid
    and t.workspace_id = workspace_uuid;

  if team_domain is null or team_domain <> workspace_domain then
    raise exception 'Time informado nao pertence ao workspace selecionado.';
  end if;

  update public.profiles
  set
    full_name = agent_full_name,
    is_active = active,
    team_id = team_uuid,
    domain_id = workspace_domain,
    updated_at = timezone('utc', now())
  where id = agent_user_id;

  if not found then
    raise exception 'Agente informado nao existe.';
  end if;

  insert into public.workspace_memberships (workspace_id, user_id, domain_id, role)
  values (workspace_uuid, agent_user_id, workspace_domain, 'agent')
  on conflict (workspace_id, user_id) do update
  set
    domain_id = excluded.domain_id,
    role = 'agent';
end;
$$;

create or replace function public.archive_workspace_agent(
  agent_user_id uuid,
  workspace_uuid uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  workspace_domain uuid;
begin
  if public.workspace_user_role(workspace_uuid) not in ('owner', 'admin') then
    raise exception 'Sem permissao para arquivar agente neste workspace.';
  end if;

  select w.domain_id
  into workspace_domain
  from public.workspaces w
  where w.id = workspace_uuid;

  if workspace_domain is null then
    raise exception 'Workspace informado nao existe.';
  end if;

  update public.profiles
  set
    is_active = false,
    updated_at = timezone('utc', now())
  where id = agent_user_id
    and domain_id = workspace_domain;

  delete from public.workspace_memberships
  where workspace_id = workspace_uuid
    and user_id = agent_user_id
    and role = 'agent';
end;
$$;

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (
  (id = auth.uid() and domain_id = public.current_domain_id())
  or (domain_id = public.current_domain_id() and public.is_domain_admin(domain_id))
)
with check (
  (id = auth.uid() and domain_id = public.current_domain_id())
  or (domain_id = public.current_domain_id() and public.is_domain_admin(domain_id))
);

drop policy if exists "products_insert_agent" on public.products;
create policy "products_insert_admin"
on public.products
for insert
to authenticated
with check (
  domain_id = public.current_domain_id()
  and public.is_domain_admin(domain_id)
);

drop policy if exists "products_update_agent" on public.products;
create policy "products_update_admin"
on public.products
for update
to authenticated
using (
  domain_id = public.current_domain_id()
  and public.is_domain_admin(domain_id)
)
with check (
  domain_id = public.current_domain_id()
  and public.is_domain_admin(domain_id)
);

drop policy if exists "products_delete_admin" on public.products;
create policy "products_delete_admin"
on public.products
for delete
to authenticated
using (
  domain_id = public.current_domain_id()
  and public.is_domain_admin(domain_id)
);

drop policy if exists "categories_insert_agent" on public.categories;
create policy "categories_insert_admin"
on public.categories
for insert
to authenticated
with check (
  domain_id = public.current_domain_id()
  and public.is_domain_admin(domain_id)
);

drop policy if exists "categories_update_agent" on public.categories;
create policy "categories_update_admin"
on public.categories
for update
to authenticated
using (
  domain_id = public.current_domain_id()
  and public.is_domain_admin(domain_id)
)
with check (
  domain_id = public.current_domain_id()
  and public.is_domain_admin(domain_id)
);

drop policy if exists "categories_delete_admin" on public.categories;
create policy "categories_delete_admin"
on public.categories
for delete
to authenticated
using (
  domain_id = public.current_domain_id()
  and public.is_domain_admin(domain_id)
);

drop policy if exists "departments_delete_admin" on public.departments;
create policy "departments_delete_admin"
on public.departments
for delete
to authenticated
using (
  domain_id = public.current_domain_id()
  and public.is_workspace_member(workspace_id)
  and public.workspace_user_role(workspace_id) in ('owner', 'admin')
);

drop policy if exists "teams_delete_admin" on public.teams;
create policy "teams_delete_admin"
on public.teams
for delete
to authenticated
using (
  domain_id = public.current_domain_id()
  and public.is_workspace_member(workspace_id)
  and public.workspace_user_role(workspace_id) in ('owner', 'admin')
);
