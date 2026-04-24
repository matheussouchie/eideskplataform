create extension if not exists pgcrypto;

create table if not exists public.ticket_statuses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  domain_id uuid not null references public.domains(id) on delete restrict,
  name text not null,
  "order" integer not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, name),
  unique (workspace_id, "order")
);

alter table public.tickets
  add column if not exists status_id uuid references public.ticket_statuses(id) on delete restrict,
  add column if not exists assigned_to uuid references auth.users(id) on delete set null;

create index if not exists idx_ticket_statuses_workspace on public.ticket_statuses(workspace_id, "order");
create index if not exists idx_ticket_statuses_domain on public.ticket_statuses(domain_id);
create index if not exists idx_tickets_status_id on public.tickets(status_id);
create index if not exists idx_tickets_assigned_to on public.tickets(assigned_to);

insert into public.ticket_statuses (workspace_id, domain_id, name, "order")
select w.id, w.domain_id, workflow_status.name, workflow_status.sort_order
from public.workspaces w
cross join (
  values
    ('Novo', 1),
    ('Em atendimento', 2),
    ('Aguardando cliente', 3),
    ('Resolvido', 4)
) as workflow_status(name, sort_order)
where not exists (
  select 1
  from public.ticket_statuses ts
  where ts.workspace_id = w.id
    and ts.name = workflow_status.name
);

create or replace function public.handle_workspace_ticket_statuses()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  insert into public.ticket_statuses (workspace_id, domain_id, name, "order")
  values
    (new.id, new.domain_id, 'Novo', 1),
    (new.id, new.domain_id, 'Em atendimento', 2),
    (new.id, new.domain_id, 'Aguardando cliente', 3),
    (new.id, new.domain_id, 'Resolvido', 4)
  on conflict (workspace_id, name) do nothing;

  return new;
end;
$$;

drop trigger if exists on_workspace_created_ticket_statuses on public.workspaces;
create trigger on_workspace_created_ticket_statuses
after insert on public.workspaces
for each row execute procedure public.handle_workspace_ticket_statuses();

update public.tickets ticket_row
set assigned_to = coalesce(ticket_row.assigned_to, ticket_row.assignee_id)
where ticket_row.assigned_to is null
  and ticket_row.assignee_id is not null;

update public.tickets ticket_row
set status_id = (
  select ts.id
  from public.ticket_statuses ts
  where ts.workspace_id = ticket_row.workspace_id
    and ts.name = case
      when ticket_row.status in ('resolved', 'closed') then 'Resolvido'
      when ticket_row.status = 'in_progress' then 'Em atendimento'
      when ticket_row.status = 'open' and coalesce(ticket_row.assigned_to, ticket_row.assignee_id) is not null then 'Aguardando cliente'
      else 'Novo'
    end
  limit 1
)
where ticket_row.status_id is null;

create or replace function public.sync_ticket_workflow_fields()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  derived_status_name text;
  derived_status_id uuid;
begin
  if new.assigned_to is null and new.assignee_id is not null then
    new.assigned_to := new.assignee_id;
  end if;

  if new.assignee_id is null and new.assigned_to is not null then
    new.assignee_id := new.assigned_to;
  end if;

  if new.status_id is null then
    derived_status_name := case
      when new.status in ('resolved', 'closed') then 'Resolvido'
      when new.status = 'in_progress' then 'Em atendimento'
      when new.status = 'open' and coalesce(new.assigned_to, new.assignee_id) is not null then 'Aguardando cliente'
      else 'Novo'
    end;

    select ts.id
    into derived_status_id
    from public.ticket_statuses ts
    where ts.workspace_id = new.workspace_id
      and ts.name = derived_status_name
    order by ts."order" asc
    limit 1;

    if derived_status_id is null then
      raise exception 'Status do fluxo nao encontrado para o ticket.';
    end if;

    new.status_id := derived_status_id;
  end if;

  select ts.name
  into derived_status_name
  from public.ticket_statuses ts
  where ts.id = new.status_id
  limit 1;

  if derived_status_name is null then
    raise exception 'status_id informado nao existe.';
  end if;

  new.status := case
    when derived_status_name = 'Em atendimento' then 'in_progress'::public.ticket_status
    when derived_status_name = 'Resolvido' then 'resolved'::public.ticket_status
    else 'open'::public.ticket_status
  end;

  new.assignee_id := new.assigned_to;

  return new;
end;
$$;

drop trigger if exists sync_ticket_workflow_fields on public.tickets;
create trigger sync_ticket_workflow_fields
before insert or update on public.tickets
for each row execute procedure public.sync_ticket_workflow_fields();

update public.tickets ticket_row
set
  status_id = ticket_row.status_id,
  assigned_to = ticket_row.assigned_to;

alter table public.tickets
  alter column status_id set not null;

alter table public.ticket_statuses enable row level security;

drop policy if exists "ticket_statuses_select_member" on public.ticket_statuses;
create policy "ticket_statuses_select_member"
on public.ticket_statuses
for select
to authenticated
using (
  domain_id = public.current_domain_id()
  and public.is_workspace_member(workspace_id)
);

drop policy if exists "ticket_statuses_insert_agent" on public.ticket_statuses;
create policy "ticket_statuses_insert_agent"
on public.ticket_statuses
for insert
to authenticated
with check (
  domain_id = public.current_domain_id()
  and public.workspace_user_role(workspace_id) = 'agent'
);

drop policy if exists "ticket_statuses_update_agent" on public.ticket_statuses;
create policy "ticket_statuses_update_agent"
on public.ticket_statuses
for update
to authenticated
using (
  domain_id = public.current_domain_id()
  and public.workspace_user_role(workspace_id) = 'agent'
)
with check (
  domain_id = public.current_domain_id()
  and public.workspace_user_role(workspace_id) = 'agent'
);

drop policy if exists "tickets_update_agent" on public.tickets;
create policy "tickets_update_agent"
on public.tickets
for update
to authenticated
using (
  domain_id = public.current_domain_id()
  and public.is_workspace_member(workspace_id)
  and public.workspace_user_role(workspace_id) = 'agent'
)
with check (
  domain_id = public.current_domain_id()
  and public.is_workspace_member(workspace_id)
  and public.workspace_user_role(workspace_id) = 'agent'
);
