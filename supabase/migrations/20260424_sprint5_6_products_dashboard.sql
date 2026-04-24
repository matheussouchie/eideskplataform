create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_id uuid references public.products(id) on delete cascade,
  domain_id uuid not null references public.domains(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain_id uuid not null references public.domains(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  unique (domain_id, name)
);

alter table public.tickets
  add column if not exists product_id uuid references public.products(id) on delete restrict,
  add column if not exists category_id uuid references public.categories(id) on delete restrict;

create index if not exists idx_products_domain on public.products(domain_id);
create index if not exists idx_products_parent on public.products(parent_id);
create index if not exists idx_categories_domain on public.categories(domain_id);
create index if not exists idx_tickets_product on public.tickets(product_id);
create index if not exists idx_tickets_category on public.tickets(category_id);

insert into public.products (domain_id, name, parent_id)
select d.id, 'EiDesk Plataforma', null
from public.domains d
where not exists (
  select 1
  from public.products p
  where p.domain_id = d.id
    and p.name = 'EiDesk Plataforma'
    and p.parent_id is null
);

insert into public.products (domain_id, name, parent_id)
select parent_product.domain_id, child_product.name, parent_product.id
from public.products parent_product
cross join (
  values
    ('Portal do Cliente'),
    ('Kanban Operacional'),
    ('Gestao de Usuarios')
) as child_product(name)
where parent_product.name = 'EiDesk Plataforma'
  and parent_product.parent_id is null
  and not exists (
    select 1
    from public.products existing_product
    where existing_product.domain_id = parent_product.domain_id
      and existing_product.parent_id = parent_product.id
      and existing_product.name = child_product.name
  );

insert into public.categories (domain_id, name)
select d.id, category_seed.name
from public.domains d
cross join (
  values
    ('Incidente'),
    ('Solicitacao'),
    ('Melhoria')
) as category_seed(name)
where not exists (
  select 1
  from public.categories c
  where c.domain_id = d.id
    and c.name = category_seed.name
);

update public.tickets ticket_row
set product_id = (
  select p.id
  from public.products p
  where p.domain_id = ticket_row.domain_id
  order by p.parent_id nulls first, p.created_at asc, p.name asc
  limit 1
)
where ticket_row.product_id is null;

update public.tickets ticket_row
set category_id = (
  select c.id
  from public.categories c
  where c.domain_id = ticket_row.domain_id
  order by c.created_at asc, c.name asc
  limit 1
)
where ticket_row.category_id is null;

alter table public.tickets
  alter column product_id set not null,
  alter column category_id set not null;

create or replace function public.validate_ticket_classification_domain()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  product_domain uuid;
  category_domain uuid;
begin
  select p.domain_id
  into product_domain
  from public.products p
  where p.id = new.product_id;

  if product_domain is null then
    raise exception 'Produto informado nao existe.';
  end if;

  select c.domain_id
  into category_domain
  from public.categories c
  where c.id = new.category_id;

  if category_domain is null then
    raise exception 'Categoria informada nao existe.';
  end if;

  if product_domain <> new.domain_id or category_domain <> new.domain_id then
    raise exception 'Produto e categoria devem pertencer ao mesmo dominio do ticket.';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_ticket_classification_domain on public.tickets;
create trigger validate_ticket_classification_domain
before insert or update on public.tickets
for each row execute procedure public.validate_ticket_classification_domain();

alter table public.products enable row level security;
alter table public.categories enable row level security;

drop policy if exists "products_select_domain_member" on public.products;
create policy "products_select_domain_member"
on public.products
for select
to authenticated
using (domain_id = public.current_domain_id());

drop policy if exists "products_insert_agent" on public.products;
create policy "products_insert_agent"
on public.products
for insert
to authenticated
with check (domain_id = public.current_domain_id());

drop policy if exists "products_update_agent" on public.products;
create policy "products_update_agent"
on public.products
for update
to authenticated
using (domain_id = public.current_domain_id())
with check (domain_id = public.current_domain_id());

drop policy if exists "categories_select_domain_member" on public.categories;
create policy "categories_select_domain_member"
on public.categories
for select
to authenticated
using (domain_id = public.current_domain_id());

drop policy if exists "categories_insert_agent" on public.categories;
create policy "categories_insert_agent"
on public.categories
for insert
to authenticated
with check (domain_id = public.current_domain_id());

drop policy if exists "categories_update_agent" on public.categories;
create policy "categories_update_agent"
on public.categories
for update
to authenticated
using (domain_id = public.current_domain_id())
with check (domain_id = public.current_domain_id());
