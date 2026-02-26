-- projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Sin nombre',
  industry text not null default '',
  duration_estimate text not null default '',
  budget_estimate text not null default '',
  methodology text not null default 'hibrido' check (methodology in ('predictivo', 'agil', 'hibrido')),
  structured_context_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- documents
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_size_bytes bigint not null,
  parsed_text text,
  page_count int,
  created_at timestamptz not null default now()
);

create index if not exists documents_project_id on public.documents(project_id);

-- artifacts (editable versions)
create table if not exists public.artifacts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  type text not null check (type in ('charter', 'risk_register', 'stakeholder_register', 'wbs', 'backlog')),
  content_json jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, type)
);

create index if not exists artifacts_project_id on public.artifacts(project_id);

-- storage bucket (run in Supabase SQL or Dashboard: Storage > New bucket "documents", public)
-- or via API when app runs: bucket is created on first upload if RLS allows
