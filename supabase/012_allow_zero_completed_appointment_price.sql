alter table public.appointments
drop constraint if exists appointments_appointment_price_check;

alter table public.appointments
add constraint appointments_appointment_price_check
check (appointment_price is null or appointment_price >= 0);

drop policy if exists "Anyone can insert appointments" on public.appointments;
create policy "Anyone can insert appointments"
on public.appointments
for insert
to anon, authenticated
with check (
  client_id is not null
  and char_length(client_name) > 0
  and status in ('confirmed', 'cancelled', 'scheduled', 'completed')
  and (
    status <> 'completed'
    or (
      service_id is not null
      and char_length(coalesce(service_name, '')) > 0
      and appointment_price >= 0
    )
  )
);

drop policy if exists "Anyone can update appointments" on public.appointments;
create policy "Anyone can update appointments"
on public.appointments
for update
to anon, authenticated
using (true)
with check (
  char_length(client_name) > 0
  and status in ('confirmed', 'cancelled', 'scheduled', 'completed')
  and (
    status <> 'completed'
    or (
      service_id is not null
      and char_length(coalesce(service_name, '')) > 0
      and appointment_price >= 0
    )
  )
);
