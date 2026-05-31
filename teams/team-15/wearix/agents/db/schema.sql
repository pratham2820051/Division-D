-- Run this in Supabase: SQL Editor → New query → Run
-- Table for Team D15 support ticket queue

create table if not exists public.tickets (
  id bigint generated always as identity primary key,
  text text not null,
  intent text,
  tier text,
  department text,
  confidence double precision,
  status text not null default 'PENDING',
  response text,
  sentiment text,
  priority text,
  sla text,
  issue_summary text,
  recommended_actions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Optional: allow read/write from your app (beginner-friendly for hackathon demo)
alter table public.tickets enable row level security;

create policy "Allow all for tickets hackathon demo"
  on public.tickets
  for all
  using (true)
  with check (true);
