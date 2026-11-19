create table if not exists tipos_incidencia (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  laboratorio_id uuid,
  created_at timestamptz not null default now()
);
alter table tipos_incidencia disable row level security;
