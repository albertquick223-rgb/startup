-- Supabase schema for CryptoStake

create table users (
  id uuid primary key,
  email text,
  username text,
  balance numeric default 0,
  role text default 'user'
);

create table settings (
  id serial primary key,
  admin_wallet text
);

create table deposits (
  id serial primary key,
  user_id uuid references users(id),
  deposit_amount numeric,
  txid text,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc', now())
);

create table withdraw (
  id serial primary key,
  user_id uuid references users(id),
  amount numeric,
  wallet text,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc', now())
);

create table staking (
  id serial primary key,
  user_id uuid references users(id),
  stake_amount numeric,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  status text default 'active',
  total_reward numeric,
  created_at timestamp with time zone default timezone('utc', now())
);
