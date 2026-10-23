-- Run once in the Supabase SQL editor (Dashboard → SQL Editor → New query).

create type category as enum ('food', 'travel', 'bills', 'other');

create table expenses (
  id         uuid primary key default gen_random_uuid(),
  title      varchar(100) not null,
  amount     numeric(12, 2) not null check (amount > 0),
  category   category not null,
  date       date not null default current_date,
  created_at timestamptz not null default now()
);

-- Both columns are heavily filtered; date descending matches the list's default order.
create index expenses_date_idx on expenses (date desc);
create index expenses_category_date_idx on expenses (category, date desc);

-- The API connects as a Postgres role over the pooler, which is not subject to RLS.
-- RLS is still enabled with no policy so that the anon/authenticated API keys, which
-- are safe to expose, cannot read or write this table directly.
alter table expenses enable row level security;
