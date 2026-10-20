-- Run once on a NEW database. Already applied manually in the team's project.
begin;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  balance numeric(18, 2) not null default 10000 check (balance >= 0),
  created_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id),
  symbol text not null check (symbol in ('AAPL', 'MSFT', 'TSLA')),
  type text not null check (type in ('BUY', 'SELL')),
  quantity integer not null check (quantity > 0),
  price numeric(18, 6) not null check (price > 0),
  created_at timestamptz not null default now()
);

create table public.positions (
  profile_id uuid not null references public.profiles(id),
  symbol text not null check (symbol in ('AAPL', 'MSFT', 'TSLA')),
  quantity integer not null default 0 check (quantity >= 0),
  primary key (profile_id, symbol)
);

create table public.snapshots (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id),
  cash_balance numeric(18, 2) not null check (cash_balance >= 0),
  positions_value numeric(18, 2) not null check (positions_value >= 0),
  total_value numeric(18, 2)
    generated always as (cash_balance + positions_value) stored,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.transactions enable row level security;
alter table public.positions enable row level security;
alter table public.snapshots enable row level security;

insert into public.profiles (id, name, balance)
values ('00000000-0000-4000-8000-000000000001', 'Demonstracinis vartotojas', 10000);

insert into public.snapshots (profile_id, cash_balance, positions_value)
values ('00000000-0000-4000-8000-000000000001', 10000, 0);

grant select on public.profiles to anon;
create policy "Allow reading demo profile"
on public.profiles for select to anon
using (id = '00000000-0000-4000-8000-000000000001'::uuid);

commit;
