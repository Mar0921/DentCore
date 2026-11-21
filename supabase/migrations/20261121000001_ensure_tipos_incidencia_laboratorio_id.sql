-- Asegurar que tipos_incidencia tiene laboratorio_id
CREATE TABLE IF NOT EXISTS public.tipos_incidencia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  laboratorio_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Agregar la columna si la tabla ya existía sin ella
ALTER TABLE public.tipos_incidencia
  ADD COLUMN IF NOT EXISTS laboratorio_id uuid;

-- Deshabilitar RLS si está activa (para pruebas/admin)
ALTER TABLE public.tipos_incidencia DISABLE ROW LEVEL SECURITY;

-- Índice para consultas por laboratorio
CREATE INDEX IF NOT EXISTS tipos_incidencia_laboratorio_idx ON public.tipos_incidencia(laboratorio_id);
