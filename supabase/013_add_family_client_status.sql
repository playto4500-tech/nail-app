alter table public.clients
drop constraint if exists clients_status_check;

alter table public.clients
add constraint clients_status_check
check (status in ('regular', 'new', 'family'));

drop policy if exists "Anyone can insert clients" on public.clients;
create policy "Anyone can insert clients"
on public.clients
for insert
to anon, authenticated
with check (char_length(name) > 0 and status in ('regular', 'new', 'family'));

drop policy if exists "Anyone can update clients" on public.clients;
create policy "Anyone can update clients"
on public.clients
for update
to anon, authenticated
using (true)
with check (char_length(name) > 0 and status in ('regular', 'new', 'family'));
