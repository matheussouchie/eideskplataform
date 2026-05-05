alter table public.workspaces
  add column if not exists owner_id uuid references auth.users (id);

update public.workspaces
set owner_id = coalesce(owner_id, created_by)
where owner_id is null;

alter table public.workspaces
  alter column owner_id set not null;

create index if not exists workspaces_owner_id_idx on public.workspaces (owner_id);

alter table public.profiles
  add column if not exists global_role text;

alter table public.profiles
  drop constraint if exists profiles_global_role_check;

alter table public.profiles
  add constraint profiles_global_role_check
  check (global_role is null or global_role = 'super_admin');

create or replace function public.sync_workspace_owner_columns()
returns trigger
language plpgsql
as $$
begin
  if new.owner_id is null then
    new.owner_id := coalesce(new.created_by, auth.uid());
  end if;

  if new.created_by is null then
    new.created_by := new.owner_id;
  end if;

  return new;
end;
$$;

drop trigger if exists sync_workspace_owner_columns on public.workspaces;
create trigger sync_workspace_owner_columns
before insert or update on public.workspaces
for each row execute procedure public.sync_workspace_owner_columns();

create or replace function public.add_workspace_member_by_email(
  workspace_uuid uuid,
  member_email text,
  member_role public.workspace_role
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text;
  target_user_id uuid;
  workspace_domain uuid;
  existing_domain uuid;
  target_full_name text;
begin
  if public.workspace_user_role(workspace_uuid) not in ('owner', 'admin') then
    raise exception 'Sem permissao para adicionar membros neste workspace.';
  end if;

  if member_role not in ('admin', 'agent', 'requester') then
    raise exception 'Role invalida para inclusao.';
  end if;

  normalized_email := lower(trim(member_email));

  if normalized_email = '' then
    raise exception 'Informe um email valido.';
  end if;

  select w.domain_id
  into workspace_domain
  from public.workspaces w
  where w.id = workspace_uuid;

  if workspace_domain is null then
    raise exception 'Workspace informado nao existe.';
  end if;

  select u.id, coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1))
  into target_user_id, target_full_name
  from auth.users u
  where lower(u.email) = normalized_email
  limit 1;

  if target_user_id is null then
    raise exception 'Nenhum usuario foi encontrado para o email informado.';
  end if;

  select p.domain_id
  into existing_domain
  from public.profiles p
  where p.id = target_user_id;

  if existing_domain is not null and existing_domain <> workspace_domain then
    raise exception 'O usuario pertence a outro tenant e nao pode entrar neste workspace.';
  end if;

  insert into public.profiles (id, domain_id, full_name, is_active)
  values (target_user_id, workspace_domain, nullif(target_full_name, ''), true)
  on conflict (id) do update
  set
    domain_id = excluded.domain_id,
    full_name = coalesce(profiles.full_name, excluded.full_name),
    updated_at = timezone('utc', now());

  insert into public.workspace_memberships (workspace_id, user_id, domain_id, role)
  values (workspace_uuid, target_user_id, workspace_domain, member_role)
  on conflict (workspace_id, user_id) do update
  set
    domain_id = excluded.domain_id,
    role = excluded.role;
end;
$$;

drop policy if exists "workspaces_select_member" on public.workspaces;
create policy "workspaces_select_member"
on public.workspaces
for select
to authenticated
using (
  domain_id = public.current_domain_id()
  and (
    owner_id = auth.uid()
    or public.is_workspace_member(id)
  )
);

drop policy if exists "workspaces_insert_authenticated" on public.workspaces;
create policy "workspaces_insert_authenticated"
on public.workspaces
for insert
to authenticated
with check (
  domain_id = public.current_domain_id()
  and owner_id = auth.uid()
  and created_by = auth.uid()
);

drop policy if exists "workspaces_update_admin" on public.workspaces;
create policy "workspaces_update_admin"
on public.workspaces
for update
to authenticated
using (
  domain_id = public.current_domain_id()
  and (
    owner_id = auth.uid()
    or public.workspace_user_role(id) in ('owner', 'admin')
  )
)
with check (
  domain_id = public.current_domain_id()
  and owner_id is not null
  and (
    owner_id = auth.uid()
    or public.workspace_user_role(id) in ('owner', 'admin')
  )
);

drop policy if exists "memberships_select_member" on public.workspace_memberships;
create policy "memberships_select_member"
on public.workspace_memberships
for select
to authenticated
using (
  domain_id = public.current_domain_id()
  and (
    user_id = auth.uid()
    or public.is_workspace_member(workspace_id)
  )
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
          and w.owner_id = auth.uid()
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
