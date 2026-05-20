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
