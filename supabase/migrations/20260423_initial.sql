create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'workspace_role') then
    create type public.workspace_role as enum ('owner', 'admin', 'agent', 'requester');
  end if;

  if not exists (select 1 from pg_type where typname = 'ticket_status') then
    create type public.ticket_status as enum ('open', 'in_progress', 'resolved', 'closed');
  end if;

  if not exists (select 1 from pg_type where typname = 'ticket_priority') then
    create type public.ticket_priority as enum ('low', 'medium', 'high', 'urgent');
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint workspaces_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table if not exists public.workspace_memberships (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.workspace_role not null default 'requester',
  created_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, user_id)
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  requester_id uuid not null references auth.users(id) on delete restrict,
  assignee_id uuid references auth.users(id) on delete set null,
  title text not null,
  description text not null,
  status public.ticket_status not null default 'open',
  priority public.ticket_priority not null default 'medium',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ticket_comments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete restrict,
  body text not null,
  internal boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_workspace_memberships_user on public.workspace_memberships(user_id);
create index if not exists idx_workspace_memberships_workspace on public.workspace_memberships(workspace_id);
create index if not exists idx_tickets_workspace_status on public.tickets(workspace_id, status);
create index if not exists idx_ticket_comments_ticket on public.ticket_comments(ticket_id);

create or replace function public.handle_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url,
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update on auth.users
for each row execute procedure public.handle_user_profile();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists set_workspaces_updated_at on public.workspaces;
create trigger set_workspaces_updated_at
before update on public.workspaces
for each row execute procedure public.set_updated_at();

drop trigger if exists set_tickets_updated_at on public.tickets;
create trigger set_tickets_updated_at
before update on public.tickets
for each row execute procedure public.set_updated_at();

create or replace function public.is_workspace_member(workspace_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_memberships wm
    where wm.workspace_id = workspace_uuid
      and wm.user_id = auth.uid()
  );
$$;

create or replace function public.workspace_user_role(workspace_uuid uuid)
returns public.workspace_role
language sql
stable
security definer
set search_path = public
as $$
  select wm.role
  from public.workspace_memberships wm
  where wm.workspace_id = workspace_uuid
    and wm.user_id = auth.uid()
  limit 1;
$$;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_memberships enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_comments enable row level security;

drop policy if exists "profiles_select_self" on public.profiles;
create policy "profiles_select_self"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.workspace_memberships wm
    where wm.user_id = public.profiles.id
      and public.is_workspace_member(wm.workspace_id)
  )
);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "workspaces_select_member" on public.workspaces;
create policy "workspaces_select_member"
on public.workspaces
for select
to authenticated
using (public.is_workspace_member(id));

drop policy if exists "workspaces_insert_authenticated" on public.workspaces;
create policy "workspaces_insert_authenticated"
on public.workspaces
for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "workspaces_update_admin" on public.workspaces;
create policy "workspaces_update_admin"
on public.workspaces
for update
to authenticated
using (public.workspace_user_role(id) in ('owner', 'admin'))
with check (public.workspace_user_role(id) in ('owner', 'admin'));

drop policy if exists "memberships_select_member" on public.workspace_memberships;
create policy "memberships_select_member"
on public.workspace_memberships
for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "memberships_insert_owner_self" on public.workspace_memberships;
create policy "memberships_insert_owner_self"
on public.workspace_memberships
for insert
to authenticated
with check (
  (
    user_id = auth.uid()
    and role = 'owner'
    and exists (
      select 1
      from public.workspaces w
      where w.id = workspace_id
        and w.created_by = auth.uid()
    )
  )
  or (
    public.workspace_user_role(workspace_id) in ('owner', 'admin')
    and role in ('admin', 'agent', 'requester')
  )
);

drop policy if exists "memberships_update_admin" on public.workspace_memberships;
create policy "memberships_update_admin"
on public.workspace_memberships
for update
to authenticated
using (public.workspace_user_role(workspace_id) in ('owner', 'admin'))
with check (public.workspace_user_role(workspace_id) in ('owner', 'admin'));

drop policy if exists "tickets_select_member" on public.tickets;
create policy "tickets_select_member"
on public.tickets
for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "tickets_insert_member" on public.tickets;
create policy "tickets_insert_member"
on public.tickets
for insert
to authenticated
with check (
  public.is_workspace_member(workspace_id)
  and requester_id = auth.uid()
);

drop policy if exists "tickets_update_agent" on public.tickets;
create policy "tickets_update_agent"
on public.tickets
for update
to authenticated
using (
  public.is_workspace_member(workspace_id)
  and public.workspace_user_role(workspace_id) in ('owner', 'admin', 'agent')
)
with check (
  public.is_workspace_member(workspace_id)
  and public.workspace_user_role(workspace_id) in ('owner', 'admin', 'agent')
);

drop policy if exists "comments_select_member" on public.ticket_comments;
create policy "comments_select_member"
on public.ticket_comments
for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "comments_insert_member" on public.ticket_comments;
create policy "comments_insert_member"
on public.ticket_comments
for insert
to authenticated
with check (
  public.is_workspace_member(workspace_id)
  and author_id = auth.uid()
);

insert into storage.buckets (id, name, public)
values ('ticket-attachments', 'ticket-attachments', false)
on conflict (id) do nothing;

drop policy if exists "ticket_attachments_select_member" on storage.objects;
create policy "ticket_attachments_select_member"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'ticket-attachments'
  and public.is_workspace_member((storage.foldername(name))[1]::uuid)
);

drop policy if exists "ticket_attachments_insert_member" on storage.objects;
create policy "ticket_attachments_insert_member"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'ticket-attachments'
  and public.is_workspace_member((storage.foldername(name))[1]::uuid)
  and owner = auth.uid()
);
