create table if not exists public.recipes (
  id text primary key,
  title text not null,
  subtitle text default '',
  category text default '집밥',
  description text default '',
  servings text default '',
  cook_time text default '',
  spicy_level text default '',
  image text default '',
  ingredients jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  tip text default '',
  updated_at timestamptz not null default now()
);

create index if not exists recipes_updated_at_idx on public.recipes (updated_at desc);

alter table public.recipes enable row level security;

-- Server-side API uses the service role key, so public policies can stay read-only if needed.
drop policy if exists "Allow public read recipes" on public.recipes;
create policy "Allow public read recipes"
  on public.recipes
  for select
  using (true);
