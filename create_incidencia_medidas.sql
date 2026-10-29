CREATE TABLE IF NOT EXISTS public.incidencia_medidas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  incidencia_id uuid REFERENCES public.incidencias(id) ON DELETE CASCADE NOT NULL,
  estado text DEFAULT 'nueva',
  fecha_resolucion date,
  responsable text,
  medidas_tomadas text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.incidencia_medidas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en incidencia_medidas" ON public.incidencia_medidas;
CREATE POLICY "Permitir todo en incidencia_medidas" ON public.incidencia_medidas FOR ALL USING (true) WITH CHECK (true);
