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

drop policy if exists "Anyone can delete appointments" on public.appointments;
create policy "Anyone can delete appointments"
on public.appointments
for delete
to anon, authenticated
using (true);

drop policy if exists "Anyone can delete appointment addons" on public.appointment_addons;
create policy "Anyone can delete appointment addons"
on public.appointment_addons
for delete
to anon, authenticated
using (true);
