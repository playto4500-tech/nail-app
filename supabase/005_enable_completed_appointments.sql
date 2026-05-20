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
  client_id is not null
  and service_id is not null
  and char_length(client_name) > 0
  and char_length(service_name) > 0
  and appointment_price > 0
  and status in ('confirmed', 'cancelled', 'scheduled', 'completed')
);
