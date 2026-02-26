alter table public.artifacts
  add column if not exists observations text not null default '';
