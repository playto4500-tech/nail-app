create table if not exists public.clients (
  id bigint generated always as identity primary key,
  name text not null,
  instagram_handle text unique,
  status text not null check (status in ('regular', 'new')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id bigint generated always as identity primary key,
  category text not null check (category in ('service', 'addon')),
  name text not null unique,
  price integer not null check (price > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id bigint generated always as identity primary key,
  client_id bigint not null references public.clients (id) on delete restrict,
  service_id bigint not null references public.services (id) on delete restrict,
  client_name text not null,
  client_instagram_handle text,
  service_name text not null,
  appointment_date date not null,
  appointment_time time not null,
  appointment_price integer not null check (appointment_price > 0),
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'past')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.appointment_addons (
  id bigint generated always as identity primary key,
  appointment_id bigint not null references public.appointments (id) on delete cascade,
  service_id bigint not null references public.services (id) on delete restrict,
  addon_price integer not null check (addon_price > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_items (
  id bigint generated always as identity primary key,
  name text not null,
  quantity numeric(10, 2) not null default 0,
  unit text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.clients enable row level security;
alter table public.services enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_addons enable row level security;
alter table public.inventory_items enable row level security;

drop policy if exists "Anyone can read clients" on public.clients;
create policy "Anyone can read clients"
on public.clients
for select
to anon, authenticated
using (true);

drop policy if exists "Anyone can insert clients" on public.clients;
create policy "Anyone can insert clients"
on public.clients
for insert
to anon, authenticated
with check (char_length(name) > 0 and status in ('regular', 'new'));

drop policy if exists "Anyone can read services" on public.services;
create policy "Anyone can read services"
on public.services
for select
to anon, authenticated
using (true);

drop policy if exists "Anyone can insert services" on public.services;
create policy "Anyone can insert services"
on public.services
for insert
to anon, authenticated
with check (category in ('service', 'addon') and price > 0 and char_length(name) > 0);

drop policy if exists "Anyone can read appointments" on public.appointments;
create policy "Anyone can read appointments"
on public.appointments
for select
to anon, authenticated
using (true);

drop policy if exists "Anyone can insert appointments" on public.appointments;
create policy "Anyone can insert appointments"
on public.appointments
for insert
to anon, authenticated
with check (
  client_id is not null
  and service_id is not null
  and char_length(client_name) > 0
  and char_length(service_name) > 0
  and appointment_price > 0
  and status in ('confirmed', 'cancelled', 'past')
);

drop policy if exists "Anyone can read appointment addons" on public.appointment_addons;
create policy "Anyone can read appointment addons"
on public.appointment_addons
for select
to anon, authenticated
using (true);

drop policy if exists "Anyone can insert appointment addons" on public.appointment_addons;
create policy "Anyone can insert appointment addons"
on public.appointment_addons
for insert
to anon, authenticated
with check (appointment_id is not null and service_id is not null and addon_price > 0);

drop policy if exists "Anyone can read inventory items" on public.inventory_items;
create policy "Anyone can read inventory items"
on public.inventory_items
for select
to anon, authenticated
using (true);

drop policy if exists "Anyone can insert inventory items" on public.inventory_items;
create policy "Anyone can insert inventory items"
on public.inventory_items
for insert
to anon, authenticated
with check (char_length(name) > 0 and quantity >= 0);

insert into public.services (category, name, price)
values
  ('service', 'Manicure hybrydowy', 120),
  ('service', 'Przedłużanie paznokci', 180),
  ('service', 'Uzupełnienie hybrydy', 90),
  ('addon', 'French', 25),
  ('addon', 'Pyłek', 20)
on conflict (name) do nothing;
