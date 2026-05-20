alter table public.appointments
drop constraint if exists appointments_status_check;

alter table public.appointments
add constraint appointments_status_check
check (status in ('confirmed', 'cancelled', 'scheduled', 'completed'));

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

alter table public.appointments
drop constraint if exists appointments_client_id_fkey;

alter table public.appointments
alter column client_id drop not null;

alter table public.appointments
add constraint appointments_client_id_fkey
foreign key (client_id)
references public.clients (id)
on delete set null;

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

do $$
declare
  service_name_fix record;
  source_id bigint;
  target_id bigint;
begin
  for service_name_fix in
    select *
    from (
      values
        ('Uzupelnienie', 'Uzupełnienie', 100, 'service'),
        ('Uzupełnienie hybrydy', 'Uzupełnienie', 100, 'service'),
        ('Przedluzania zelowe do 2', 'Przedłużenie żelowe do 2', 120, 'service'),
        ('Przedluzenie zelowe do 2', 'Przedłużenie żelowe do 2', 120, 'service'),
        ('Przedłużanie paznokci', 'Przedłużenie żelowe do 2', 120, 'service'),
        ('Przedluzanie zelowe od 2', 'Przedłużenie żelowe od 2', 140, 'service'),
        ('Przedluzenie zelowe od 2', 'Przedłużenie żelowe od 2', 140, 'service'),
        ('Zel na naturalnej plytce', 'Żel na naturalnej płytce', 100, 'service'),
        ('Pylek', 'Wzorki', 20, 'addon'),
        ('pylek', 'Wzorki', 20, 'addon'),
        ('pyłek', 'Wzorki', 20, 'addon')
    ) as fixes(old_name, new_name, price, category)
  loop
    select id into source_id
    from public.services
    where name = service_name_fix.old_name
    limit 1;

    if source_id is not null then
      select id into target_id
      from public.services
      where name = service_name_fix.new_name
      limit 1;

      if target_id is null then
        update public.services
        set
          name = service_name_fix.new_name,
          price = service_name_fix.price,
          category = service_name_fix.category
        where id = source_id;
      else
        update public.appointments
        set
          service_id = target_id,
          service_name = service_name_fix.new_name
        where service_id = source_id;

        update public.appointment_addons
        set service_id = target_id
        where service_id = source_id;

        delete from public.services
        where id = source_id;

        update public.services
        set
          price = service_name_fix.price,
          category = service_name_fix.category
        where id = target_id;
      end if;
    end if;
  end loop;
end $$;

update public.appointments
set service_name = case
  when service_name in ('Uzupelnienie', 'Uzupełnienie hybrydy') then 'Uzupełnienie'
  when service_name in ('Przedluzania zelowe do 2', 'Przedluzenie zelowe do 2', 'Przedłużanie paznokci') then 'Przedłużenie żelowe do 2'
  when service_name in ('Przedluzanie zelowe od 2', 'Przedluzenie zelowe od 2') then 'Przedłużenie żelowe od 2'
  when service_name = 'Zel na naturalnej plytce' then 'Żel na naturalnej płytce'
  when service_name in ('Pylek', 'pylek', 'pyłek') then 'Wzorki'
  else service_name
end
where service_name in (
  'Uzupelnienie',
  'Uzupełnienie hybrydy',
  'Przedluzania zelowe do 2',
  'Przedluzenie zelowe do 2',
  'Przedłużanie paznokci',
  'Przedluzanie zelowe od 2',
  'Przedluzenie zelowe od 2',
  'Zel na naturalnej plytce',
  'Pylek',
  'pylek',
  'pyłek'
);

create table if not exists public.expenses (
  id bigint generated always as identity primary key,
  name text not null,
  amount integer not null check (amount > 0),
  source text not null,
  expense_date date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.expenses enable row level security;

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
