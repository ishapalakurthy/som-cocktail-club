-- Cocktail Club database schema.
-- Safe to run more than once (uses IF NOT EXISTS).
-- On Supabase: paste this into SQL Editor -> New query -> Run.

create extension if not exists pgcrypto;

create table if not exists admins (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  name          text not null,
  password_hash text not null,
  created_at    timestamptz not null default now()
);

create table if not exists events (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  description  text not null default '',
  location     text not null default '',
  starts_at    timestamptz not null,
  opens_at     timestamptz not null,           -- when signups unlock
  price_cents  integer not null default 0,
  venmo_handle text not null default '',
  zelle_info   text not null default '',
  cap_first    integer not null check (cap_first >= 0),   -- 1st years + 1-year degrees
  cap_second   integer not null check (cap_second >= 0),  -- 2nd years + exchange
  archived     boolean not null default false,
  created_at   timestamptz not null default now()
);

create table if not exists signups (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references events(id) on delete cascade,
  token          text not null unique,          -- secret for the student's status link
  name           text not null,
  email          text not null,
  category       text not null,
  group_key      text not null check (group_key in ('first', 'second')),
  dietary        text not null default '',
  status         text not null check (status in ('confirmed', 'waitlist', 'removed')),
  created_at     timestamptz not null default clock_timestamp(),  -- signup order
  confirmed_at   timestamptz,                   -- start of the 24h payment window
  paid           boolean not null default false,
  payment_method text check (payment_method in ('venmo', 'zelle', 'other')),
  paid_at        timestamptz,
  removed_at     timestamptz,
  removed_by     text                           -- 'self' or the admin's email
);

create index if not exists signups_event_idx on signups (event_id, group_key, status, created_at);

-- One active signup per person per event. Partners share an email, so name is part of the key.
create unique index if not exists signups_one_per_person
  on signups (event_id, lower(email), lower(name))
  where status <> 'removed';

-- Nobody but the server (which connects as the database owner) can read these tables.
alter table admins  enable row level security;
alter table events  enable row level security;
alter table signups enable row level security;
