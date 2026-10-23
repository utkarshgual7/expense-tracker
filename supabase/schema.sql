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

-- The API talks to Postgres with the service role key, so RLS is enabled with no
-- public policy: anon/authenticated clients get nothing, the API bypasses RLS.
alter table expenses enable row level security;

-- PostgREST can't SUM over a filtered set, and pulling every matching row into the
-- API to add it up does not scale. These two functions keep the aggregation in Postgres.

create or replace function expenses_totals(
  p_category category default null,
  p_from     date     default null,
  p_to       date     default null
) returns table (total_count bigint, total_amount numeric)
language sql
stable
as $$
  select count(*)::bigint, coalesce(sum(amount), 0)
  from expenses
  where (p_category is null or category = p_category)
    and (p_from     is null or date >= p_from)
    and (p_to       is null or date <= p_to);
$$;

create or replace function expenses_monthly_summary(p_month date)
returns table (category category, total numeric)
language sql
stable
as $$
  select category, sum(amount)
  from expenses
  where date >= p_month and date < (p_month + interval '1 month')
  group by category;
$$;
