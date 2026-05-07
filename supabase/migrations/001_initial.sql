-- Enable moddatetime extension for auto-updating updated_at
create extension if not exists moddatetime schema extensions;

create table journal_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  entry_date date not null,
  content text default null,
  video_url text default null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, entry_date)
);

-- Auto-update updated_at on every UPDATE
create trigger handle_updated_at
  before update on journal_entries
  for each row execute procedure extensions.moddatetime(updated_at);

-- RLS
alter table journal_entries enable row level security;

create policy "select_own_entries"
  on journal_entries for select
  using (auth.uid() = user_id);

create policy "insert_own_entries"
  on journal_entries for insert
  with check (auth.uid() = user_id);

create policy "update_own_entries"
  on journal_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
