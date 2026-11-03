-- Cocktail Club database schema.
-- Safe to run more than once (uses IF NOT EXISTS).
-- On Supabase: paste this into SQL Editor -> New query -> Run.

create extension if not exists pgcrypto;

-- The board: only emails listed here can sign in to /admin, each with their own password.
create table if not exists admins (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  name          text not null,
  password_hash text,
  added_by      text,                           -- email of the board member who added them
  created_at    timestamptz not null default now()
);
alter table admins add column if not exists password_hash text;
alter table admins add column if not exists added_by text;
drop table if exists admin_login_tokens;

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

-- Partner signups: the partner gets their own row (own spot, dietary, payment) linked to the student.
-- together = true means the pair is only ever confirmed or waitlisted as a unit.
alter table signups add column if not exists partner_of uuid references signups(id) on delete set null;
alter table signups add column if not exists together boolean not null default true;

create index if not exists signups_event_idx on signups (event_id, group_key, status, created_at);

-- One active signup per person per event. Partners share an email, so name is part of the key.
create unique index if not exists signups_one_per_person
  on signups (event_id, lower(email), lower(name))
  where status <> 'removed';

-- Recipe book. A recipe belongs to one of our events, or to a past event that was never in the app
-- (past_event_name + past_event_date, the first of that month). Drafts are only visible to leads.
create table if not exists recipes (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  name            text not null,
  description     text not null default '',
  spirit          text not null,
  ingredients     jsonb not null default '[]',  -- [{ "amount": "2 oz", "item": "Mezcal" }, ...]
  method          text not null default '',     -- one step per line
  glass           text not null default '',
  garnish         text not null default '',
  created_by      text not null default '',
  event_id        uuid references events(id) on delete set null,
  past_event_name text,
  past_event_date date,
  published       boolean not null default false,
  created_at      timestamptz not null default clock_timestamp(),
  updated_at      timestamptz not null default now()
);

-- Nobody but the server (which connects as the database owner) can read these tables.
alter table admins  enable row level security;
alter table events  enable row level security;
alter table signups enable row level security;
alter table recipes enable row level security;
