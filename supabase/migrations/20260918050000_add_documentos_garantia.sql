CREATE TABLE IF NOT EXISTS public.documentos_garantia (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  solicitud_id UUID NOT NULL REFERENCES public.solicitudes(id) ON DELETE CASCADE,
  laboratorio_id UUID,
  archivo_url TEXT,
  nombre_archivo TEXT,
  tipo_mime TEXT,
  tamaño_bytes INTEGER,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.documentos_garantia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert documentos_garantia" ON public.documentos_garantia FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public select documentos_garantia" ON public.documentos_garantia FOR SELECT TO public USING (true);
CREATE POLICY "Allow public update documentos_garantia" ON public.documentos_garantia FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete documentos_garantia" ON public.documentos_garantia FOR DELETE TO public USING (true);

CREATE INDEX IF NOT EXISTS idx_documentos_garantia_solicitud ON public.documentos_garantia(solicitud_id);
