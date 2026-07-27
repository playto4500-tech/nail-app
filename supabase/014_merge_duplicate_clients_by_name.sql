drop table if exists public._duplicate_client_merged_values;
drop table if exists public._duplicate_client_merge;

create table public._duplicate_client_merge as
with normalized_clients as (
  select
    id,
    lower(regexp_replace(btrim(name), '[[:space:]]+', ' ', 'g')) as normalized_name
  from public.clients
),
canonical_clients as (
  select
    normalized_name,
    min(id) as canonical_id
  from normalized_clients
  group by normalized_name
)
select
  normalized_clients.id as duplicate_id,
  canonical_clients.canonical_id
from normalized_clients
join canonical_clients
  on canonical_clients.normalized_name = normalized_clients.normalized_name
where normalized_clients.id <> canonical_clients.canonical_id;

create table public._duplicate_client_merged_values as
select
  _duplicate_client_merge.canonical_id,
  max(clients.instagram_handle) filter (
    where clients.instagram_handle is not null
  ) as instagram_handle,
  string_agg(clients.notes, E'\n' order by clients.created_at) filter (
    where clients.notes is not null and btrim(clients.notes) <> ''
  ) as notes
from public._duplicate_client_merge
join public.clients
  on clients.id = _duplicate_client_merge.duplicate_id
group by _duplicate_client_merge.canonical_id;

update public.appointments as appointment
set
  client_id = _duplicate_client_merge.canonical_id,
  client_name = canonical.name,
  client_instagram_handle = coalesce(canonical.instagram_handle, appointment.client_instagram_handle)
from public._duplicate_client_merge
join public.clients as canonical
  on canonical.id = _duplicate_client_merge.canonical_id
where appointment.client_id = _duplicate_client_merge.duplicate_id;

delete from public.clients
using public._duplicate_client_merge
where clients.id = _duplicate_client_merge.duplicate_id;

update public.clients as canonical
set
  instagram_handle = coalesce(canonical.instagram_handle, _duplicate_client_merged_values.instagram_handle),
  notes = nullif(concat_ws(E'\n', canonical.notes, _duplicate_client_merged_values.notes), '')
from public._duplicate_client_merged_values
where canonical.id = _duplicate_client_merged_values.canonical_id
  and (
    _duplicate_client_merged_values.instagram_handle is null
    or canonical.instagram_handle is not null
    or not exists (
      select 1
      from public.clients as other_client
      where other_client.id <> canonical.id
        and other_client.instagram_handle = _duplicate_client_merged_values.instagram_handle
    )
  );

update public.appointments as appointment
set
  client_name = canonical.name,
  client_instagram_handle = canonical.instagram_handle
from public.clients as canonical
where appointment.client_id = canonical.id
  and canonical.instagram_handle is not null;

create unique index if not exists clients_normalized_name_unique
on public.clients ((lower(regexp_replace(btrim(name), '[[:space:]]+', ' ', 'g'))));

drop table if exists public._duplicate_client_merged_values;
drop table if exists public._duplicate_client_merge;
