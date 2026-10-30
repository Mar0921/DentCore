ALTER TABLE public.fichas_tecnicas ADD COLUMN IF NOT EXISTS tipo TEXT;
ALTER TABLE public.fichas_tecnicas ADD COLUMN IF NOT EXISTS secciones JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.fichas_tecnicas ADD COLUMN IF NOT EXISTS fecha TEXT;

CREATE INDEX IF NOT EXISTS idx_fichas_tecnicas_tipo ON public.fichas_tecnicas(tipo);
