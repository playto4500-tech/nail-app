alter table public.appointments
add column if not exists deleted_at timestamptz;
