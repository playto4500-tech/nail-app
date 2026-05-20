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
  client_id bigint references public.clients (id) on delete set null,
  service_id bigint not null references public.services (id) on delete restrict,
  client_name text not null,
  client_instagram_handle text,
  service_name text not null,
  appointment_date date not null,
  appointment_time time not null,
  appointment_price integer not null check (appointment_price > 0),
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'scheduled', 'completed')),
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

create table if not exists public.expenses (
  id bigint generated always as identity primary key,
  name text not null,
  amount integer not null check (amount > 0),
  source text not null,
  expense_date date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.clients enable row level security;
alter table public.services enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_addons enable row level security;
alter table public.inventory_items enable row level security;
alter table public.expenses enable row level security;

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

drop policy if exists "Anyone can update clients" on public.clients;
create policy "Anyone can update clients"
on public.clients
for update
to anon, authenticated
using (true)
with check (char_length(name) > 0 and status in ('regular', 'new'));

drop policy if exists "Anyone can delete clients" on public.clients;
create policy "Anyone can delete clients"
on public.clients
for delete
to anon, authenticated
using (true);

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

drop policy if exists "Anyone can update services" on public.services;
create policy "Anyone can update services"
on public.services
for update
to anon, authenticated
using (true)
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
  and
  service_id is not null
  and char_length(client_name) > 0
  and char_length(service_name) > 0
  and appointment_price > 0
  and status in ('confirmed', 'cancelled', 'scheduled', 'completed')
);

drop policy if exists "Anyone can update appointments" on public.appointments;
create policy "Anyone can update appointments"
on public.appointments
for update
to anon, authenticated
using (true)
with check (
  service_id is not null
  and char_length(client_name) > 0
  and char_length(service_name) > 0
  and appointment_price > 0
  and status in ('confirmed', 'cancelled', 'scheduled', 'completed')
);

drop policy if exists "Anyone can delete appointments" on public.appointments;
create policy "Anyone can delete appointments"
on public.appointments
for delete
to anon, authenticated
using (true);

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

drop policy if exists "Anyone can delete appointment addons" on public.appointment_addons;
create policy "Anyone can delete appointment addons"
on public.appointment_addons
for delete
to anon, authenticated
using (true);

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

drop policy if exists "Anyone can read expenses" on public.expenses;
create policy "Anyone can read expenses"
on public.expenses
for select
to anon, authenticated
using (true);

drop policy if exists "Anyone can insert expenses" on public.expenses;
create policy "Anyone can insert expenses"
on public.expenses
for insert
to anon, authenticated
with check (
  char_length(name) > 0
  and amount > 0
  and char_length(source) > 0
);

drop policy if exists "Anyone can delete expenses" on public.expenses;
create policy "Anyone can delete expenses"
on public.expenses
for delete
to anon, authenticated
using (true);

insert into public.services (category, name, price)
values
  ('service', 'Uzupełnienie', 100),
  ('service', 'Przedłużenie żelowe do 2', 120),
  ('service', 'Przedłużenie żelowe od 2', 140),
  ('service', 'Hybryda', 80),
  ('service', 'Manicure', 50),
  ('service', 'Pedicure', 80),
  ('service', 'Żel na naturalnej płytce', 100),
  ('addon', 'Wzorki', 20),
  ('addon', 'French', 10),
  ('addon', 'Baby boomer', 20)
on conflict (name) do nothing;
