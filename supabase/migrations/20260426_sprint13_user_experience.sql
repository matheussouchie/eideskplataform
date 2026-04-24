alter table public.profiles
  add column if not exists theme_preference text not null default 'light';

alter table public.profiles
  drop constraint if exists profiles_theme_preference_check;

alter table public.profiles
  add constraint profiles_theme_preference_check
  check (theme_preference in ('light', 'dark'));

create table if not exists public.ticket_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  domain_id uuid not null references public.domains(id) on delete restrict,
  title text,
  description text,
  product_id uuid references public.products(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  priority public.ticket_priority,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, workspace_id)
);

create index if not exists ticket_drafts_user_idx
  on public.ticket_drafts (user_id);

create index if not exists ticket_drafts_workspace_idx
  on public.ticket_drafts (workspace_id);

create index if not exists ticket_drafts_domain_idx
  on public.ticket_drafts (domain_id);

create or replace function public.sync_ticket_draft_domain()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  workspace_domain uuid;
begin
  select domain_id
  into workspace_domain
  from public.workspaces
  where id = new.workspace_id;

  if workspace_domain is null then
    raise exception 'Workspace do rascunho nao encontrado.';
  end if;

  if new.domain_id is distinct from workspace_domain then
    raise exception 'domain_id do rascunho precisa corresponder ao dominio do workspace.';
  end if;

  if new.product_id is not null and not exists (
    select 1
    from public.products p
    where p.id = new.product_id
      and p.domain_id = new.domain_id
  ) then
    raise exception 'Produto do rascunho nao pertence ao dominio do usuario.';
  end if;

  if new.category_id is not null and not exists (
    select 1
    from public.categories c
    where c.id = new.category_id
      and c.domain_id = new.domain_id
  ) then
    raise exception 'Categoria do rascunho nao pertence ao dominio do usuario.';
  end if;

  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists ticket_drafts_sync_trigger on public.ticket_drafts;
create trigger ticket_drafts_sync_trigger
before insert or update on public.ticket_drafts
for each row
execute function public.sync_ticket_draft_domain();

alter table public.ticket_drafts enable row level security;

drop policy if exists "ticket_drafts_select_self" on public.ticket_drafts;
create policy "ticket_drafts_select_self"
on public.ticket_drafts
for select
to authenticated
using (
  user_id = auth.uid()
  and domain_id = public.current_domain_id()
  and public.is_workspace_member(workspace_id)
);

drop policy if exists "ticket_drafts_insert_self" on public.ticket_drafts;
create policy "ticket_drafts_insert_self"
on public.ticket_drafts
for insert
to authenticated
with check (
  user_id = auth.uid()
  and domain_id = public.current_domain_id()
  and public.is_workspace_member(workspace_id)
);

drop policy if exists "ticket_drafts_update_self" on public.ticket_drafts;
create policy "ticket_drafts_update_self"
on public.ticket_drafts
for update
to authenticated
using (
  user_id = auth.uid()
  and domain_id = public.current_domain_id()
  and public.is_workspace_member(workspace_id)
)
with check (
  user_id = auth.uid()
  and domain_id = public.current_domain_id()
  and public.is_workspace_member(workspace_id)
);

drop policy if exists "ticket_drafts_delete_self" on public.ticket_drafts;
create policy "ticket_drafts_delete_self"
on public.ticket_drafts
for delete
to authenticated
using (
  user_id = auth.uid()
  and domain_id = public.current_domain_id()
  and public.is_workspace_member(workspace_id)
);

insert into storage.buckets (id, name, public, file_size_limit)
values ('profile-avatars', 'profile-avatars', false, 52428800)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;

drop policy if exists "profile_avatars_select_own" on storage.objects;
create policy "profile_avatars_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'profile-avatars'
  and auth.uid()::text = split_part(name, '/', 1)
);

drop policy if exists "profile_avatars_insert_own" on storage.objects;
create policy "profile_avatars_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-avatars'
  and auth.uid()::text = split_part(name, '/', 1)
);

drop policy if exists "profile_avatars_update_own" on storage.objects;
create policy "profile_avatars_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-avatars'
  and auth.uid()::text = split_part(name, '/', 1)
)
with check (
  bucket_id = 'profile-avatars'
  and auth.uid()::text = split_part(name, '/', 1)
);

drop policy if exists "profile_avatars_delete_own" on storage.objects;
create policy "profile_avatars_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-avatars'
  and auth.uid()::text = split_part(name, '/', 1)
);
