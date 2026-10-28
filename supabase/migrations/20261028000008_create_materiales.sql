-- Tabla de materiales del laboratorio
CREATE TABLE IF NOT EXISTS public.materiales (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo text,
  nombre text NOT NULL,
  numero_lote text,
  categoria text,
  tipo_material text,
  marca_fabricante text,
  ref_fabricante text,
  material text,
  producto text,
  proveedor text,
  archivo_url text,
  laboratorio_id uuid REFERENCES public.laboratorio(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_materiales_laboratorio ON public.materiales(laboratorio_id);
CREATE INDEX IF NOT EXISTS idx_materiales_categoria ON public.materiales(categoria);

ALTER TABLE public.materiales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo materiales" ON public.materiales;
CREATE POLICY "Permitir todo materiales" ON public.materiales FOR ALL USING (true) WITH CHECK (true);
