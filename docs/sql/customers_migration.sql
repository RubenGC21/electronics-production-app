-- Customers + Work Orders migration
-- Fecha: 2026-03-17

begin;

create extension if not exists pgcrypto;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamp with time zone default now()
);

create unique index if not exists customers_name_ci_unique
  on public.customers (lower(name));

alter table public.work_orders
  add column if not exists customer_id uuid;

insert into public.customers (name)
select distinct trim(wo.customer_name) as name
from public.work_orders wo
where wo.customer_name is not null
  and trim(wo.customer_name) <> ''
on conflict (lower(name)) do nothing;

update public.work_orders wo
set customer_id = c.id
from public.customers c
where wo.customer_id is null
  and wo.customer_name is not null
  and trim(wo.customer_name) <> ''
  and lower(trim(wo.customer_name)) = lower(c.name);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'work_orders_customer_id_fkey'
  ) then
    alter table public.work_orders
      add constraint work_orders_customer_id_fkey
      foreign key (customer_id) references public.customers(id)
      on update cascade
      on delete set null;
  end if;
end $$;

create index if not exists work_orders_customer_id_idx
  on public.work_orders(customer_id);

alter table public.customers enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'customers'
      and policyname = 'customers_select_anon_authenticated'
  ) then
    create policy customers_select_anon_authenticated
      on public.customers
      for select
      to anon, authenticated
      using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'customers'
      and policyname = 'customers_insert_anon_authenticated'
  ) then
    create policy customers_insert_anon_authenticated
      on public.customers
      for insert
      to anon, authenticated
      with check (true);
  end if;
end $$;

commit;
