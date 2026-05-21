alter table public.appointments
add column if not exists appointment_tip integer;

alter table public.appointments
drop constraint if exists appointments_appointment_tip_check;

alter table public.appointments
add constraint appointments_appointment_tip_check
check (appointment_tip is null or appointment_tip >= 0);
