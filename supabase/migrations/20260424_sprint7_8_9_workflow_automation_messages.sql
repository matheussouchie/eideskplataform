create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists is_active boolean not null default true;

create table if not exists public.ticket_attachments (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references public.domains(id) on delete restrict,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  comment_id uuid not null references public.ticket_comments(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  bucket_id text not null default 'ticket-attachments',
  storage_path text not null unique,
  file_name text not null,
  content_type text,
  file_size bigint not null check (file_size > 0 and file_size <= 52428800),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_profiles_active on public.profiles(is_active);
create index if not exists idx_ticket_attachments_ticket on public.ticket_attachments(ticket_id);
create index if not exists idx_ticket_attachments_comment on public.ticket_attachments(comment_id);
create index if not exists idx_ticket_attachments_workspace on public.ticket_attachments(workspace_id);
create index if not exists idx_ticket_attachments_domain on public.ticket_attachments(domain_id);

create or replace function public.validate_ticket_attachment_context()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  ticket_domain uuid;
  ticket_workspace uuid;
  comment_ticket uuid;
  comment_workspace uuid;
  comment_domain uuid;
begin
  select t.domain_id, t.workspace_id
  into ticket_domain, ticket_workspace
  from public.tickets t
  where t.id = new.ticket_id;

  if ticket_domain is null then
    raise exception 'Ticket informado nao existe para o anexo.';
  end if;

  select tc.ticket_id, tc.workspace_id, tc.domain_id
  into comment_ticket, comment_workspace, comment_domain
  from public.ticket_comments tc
  where tc.id = new.comment_id;

  if comment_ticket is null then
    raise exception 'Mensagem informada nao existe para o anexo.';
  end if;

  if comment_ticket <> new.ticket_id then
    raise exception 'O anexo deve pertencer a uma mensagem do mesmo ticket.';
  end if;

  if new.domain_id <> ticket_domain or new.domain_id <> comment_domain then
    raise exception 'O anexo deve pertencer ao mesmo dominio do ticket e da mensagem.';
  end if;

  if new.workspace_id <> ticket_workspace or new.workspace_id <> comment_workspace then
    raise exception 'O anexo deve pertencer ao mesmo workspace do ticket e da mensagem.';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_ticket_attachment_context on public.ticket_attachments;
create trigger validate_ticket_attachment_context
before insert or update on public.ticket_attachments
for each row execute procedure public.validate_ticket_attachment_context();

alter table public.ticket_attachments enable row level security;

drop policy if exists "comments_select_member" on public.ticket_comments;
create policy "comments_select_member"
on public.ticket_comments
for select
to authenticated
using (
  public.is_workspace_member(workspace_id)
  and (
    not internal
    or public.workspace_user_role(workspace_id) <> 'requester'
  )
);

drop policy if exists "comments_insert_member" on public.ticket_comments;
create policy "comments_insert_member"
on public.ticket_comments
for insert
to authenticated
with check (
  public.is_workspace_member(workspace_id)
  and author_id = auth.uid()
  and (
    not internal
    or public.workspace_user_role(workspace_id) <> 'requester'
  )
);

drop policy if exists "comments_delete_author" on public.ticket_comments;
create policy "comments_delete_author"
on public.ticket_comments
for delete
to authenticated
using (
  public.is_workspace_member(workspace_id)
  and author_id = auth.uid()
);

drop policy if exists "ticket_attachments_select_member" on public.ticket_attachments;
create policy "ticket_attachments_select_member"
on public.ticket_attachments
for select
to authenticated
using (
  domain_id = public.current_domain_id()
  and public.is_workspace_member(workspace_id)
  and exists (
    select 1
    from public.ticket_comments tc
    where tc.id = comment_id
      and (
        not tc.internal
        or public.workspace_user_role(workspace_id) <> 'requester'
      )
  )
);

drop policy if exists "ticket_attachments_insert_member" on public.ticket_attachments;
create policy "ticket_attachments_insert_member"
on public.ticket_attachments
for insert
to authenticated
with check (
  domain_id = public.current_domain_id()
  and public.is_workspace_member(workspace_id)
  and uploaded_by = auth.uid()
  and exists (
    select 1
    from public.ticket_comments tc
    where tc.id = comment_id
      and (
        not tc.internal
        or public.workspace_user_role(workspace_id) <> 'requester'
      )
  )
);

drop policy if exists "ticket_attachments_delete_author" on public.ticket_attachments;
create policy "ticket_attachments_delete_author"
on public.ticket_attachments
for delete
to authenticated
using (
  domain_id = public.current_domain_id()
  and public.is_workspace_member(workspace_id)
  and uploaded_by = auth.uid()
);

drop policy if exists "ticket_attachments_select_member" on storage.objects;
create policy "ticket_attachments_select_member"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'ticket-attachments'
  and exists (
    select 1
    from public.ticket_attachments ta
    where ta.storage_path = name
      and ta.domain_id = public.current_domain_id()
      and public.is_workspace_member(ta.workspace_id)
      and exists (
        select 1
        from public.ticket_comments tc
        where tc.id = ta.comment_id
          and (
            not tc.internal
            or public.workspace_user_role(ta.workspace_id) <> 'requester'
          )
      )
  )
);

drop policy if exists "ticket_attachments_delete_member" on storage.objects;
create policy "ticket_attachments_delete_member"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'ticket-attachments'
  and owner = auth.uid()
  and public.is_workspace_member((storage.foldername(name))[1]::uuid)
);
