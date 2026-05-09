alter table public.appointments
drop constraint if exists appointments_status_check;

update public.appointments
set status = 'scheduled'
where status = 'past';

alter table public.appointments
add constraint appointments_status_check
check (status in ('confirmed', 'cancelled', 'scheduled'));

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
  and status in ('confirmed', 'cancelled', 'scheduled')
);
