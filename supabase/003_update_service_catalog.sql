update public.services
set
  name = 'Hybryda',
  price = 80
where name = 'Manicure hybrydowy';

update public.services
set
  name = 'Uzupełnienie',
  price = 100
where name in ('Uzupełnienie hybrydy', 'Uzupelnienie');

update public.services
set
  name = 'Przedłużenie żelowe do 2',
  price = 120
where name in ('Przedłużanie paznokci', 'Przedluzania zelowe do 2');

update public.services
set
  name = 'French',
  price = 10
where lower(name) = 'french';

update public.services
set
  name = 'Wzorki',
  price = 20
where lower(name) in ('pyłek', 'pylek', 'wzorki');

update public.services
set
  name = 'Żel na naturalnej płytce',
  price = 100
where name in ('Zel na naturalnej plytce', 'Żel na naturalnej płytce');

update public.services
set
  name = 'Baby boomer',
  price = 20
where lower(name) = 'baby boomer';

insert into public.services (category, name, price)
values
  ('service', 'Przedłużenie żelowe od 2', 140),
  ('service', 'Manicure', 50),
  ('service', 'Pedicure', 80),
  ('service', 'Żel na naturalnej płytce', 100),
  ('addon', 'Baby boomer', 20),
  ('addon', 'French', 10),
  ('addon', 'Wzorki', 20)
on conflict (name) do update
set
  category = excluded.category,
  price = excluded.price;

drop policy if exists "Anyone can update services" on public.services;
create policy "Anyone can update services"
on public.services
for update
to anon, authenticated
using (true)
with check (category in ('service', 'addon') and price > 0 and char_length(name) > 0);
