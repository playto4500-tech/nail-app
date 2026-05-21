alter table public.services
drop constraint if exists services_price_check;

alter table public.services
add constraint services_price_check
check (price >= 0);

alter table public.services
drop constraint if exists services_name_key;

alter table public.services
add constraint services_category_name_key
unique (category, name);

drop policy if exists "Anyone can insert services" on public.services;
create policy "Anyone can insert services"
on public.services
for insert
to anon, authenticated
with check (category in ('service', 'addon') and price >= 0 and char_length(name) > 0);

drop policy if exists "Anyone can update services" on public.services;
create policy "Anyone can update services"
on public.services
for update
to anon, authenticated
using (true)
with check (category in ('service', 'addon') and price >= 0 and char_length(name) > 0);

insert into public.services (category, name, price)
values
  ('service', 'Inne', 0),
  ('addon', 'Inne', 0)
on conflict (category, name) do update
set
  price = excluded.price;
