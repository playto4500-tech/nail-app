insert into public.services (category, name, price)
values
  ('service', 'Hybryda', 80),
  ('addon', 'Wzorki', 20)
on conflict (name) do update
set
  category = excluded.category,
  price = excluded.price;

with fallback_service as (
  select id
  from public.services
  where name = 'Hybryda'
  limit 1
),
invalid_service as (
  select id
  from public.services
  where lower(name) = 'dis'
)
update public.appointments
set
  service_id = fallback_service.id,
  service_name = 'Hybryda',
  appointment_price = 80
from fallback_service, invalid_service
where public.appointments.service_id = invalid_service.id;

with fallback_service as (
  select id
  from public.services
  where name = 'Hybryda'
  limit 1
),
invalid_service as (
  select id
  from public.services
  where lower(name) = 'kutas'
)
update public.appointments
set
  service_id = fallback_service.id,
  service_name = 'Hybryda',
  appointment_price = 80
from fallback_service, invalid_service
where public.appointments.service_id = invalid_service.id;

with fallback_addon as (
  select id
  from public.services
  where name = 'Wzorki'
  limit 1
),
invalid_addon as (
  select id
  from public.services
  where lower(name) = 'dis'
  limit 1
)
update public.appointment_addons
set
  service_id = fallback_addon.id,
  addon_price = 20
from fallback_addon, invalid_addon
where public.appointment_addons.service_id = invalid_addon.id;

with fallback_addon as (
  select id
  from public.services
  where name = 'Wzorki'
  limit 1
),
invalid_addon as (
  select id
  from public.services
  where lower(name) = 'kutas'
  limit 1
)
update public.appointment_addons
set
  service_id = fallback_addon.id,
  addon_price = 20
from fallback_addon, invalid_addon
where public.appointment_addons.service_id = invalid_addon.id;

delete from public.services
where lower(name) in ('dis', 'kutas');
