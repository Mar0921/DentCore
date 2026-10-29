CREATE TABLE IF NOT EXISTS public.fichas_tecnicas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  solicitud_id UUID NOT NULL REFERENCES public.solicitudes(id) ON DELETE CASCADE,
  laboratorio_id UUID,
  nombre_archivo TEXT,
  archivo_url TEXT,
  tipo_mime TEXT,
  tamaño_bytes INTEGER,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.fichas_tecnicas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert fichas_tecnicas" ON public.fichas_tecnicas FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public select fichas_tecnicas" ON public.fichas_tecnicas FOR SELECT TO public USING (true);
CREATE POLICY "Allow public update fichas_tecnicas" ON public.fichas_tecnicas FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete fichas_tecnicas" ON public.fichas_tecnicas FOR DELETE TO public USING (true);

CREATE INDEX IF NOT EXISTS idx_fichas_tecnicas_solicitud ON public.fichas_tecnicas(solicitud_id);
