-- Crear tabla incidencias
CREATE TABLE IF NOT EXISTS public.incidencias (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo text UNIQUE NOT NULL,
  solicitud_id uuid REFERENCES public.solicitudes(id) ON DELETE SET NULL,
  solicitud_codigo_trazabilidad text,
  tipo text NOT NULL,
  fecha date NOT NULL,
  hora time without time zone NOT NULL,
  fase text,
  descripcion text NOT NULL,
  responsable text,
  estado text DEFAULT 'abierta' CHECK (estado IN ('abierta', 'en_proceso', 'cerrada')),
  fecha_creacion timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_incidencias_solicitud_id ON public.incidencias(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_incidencias_codigo ON public.incidencias(codigo);
CREATE INDEX IF NOT EXISTS idx_incidencias_fecha ON public.incidencias(fecha);

ALTER TABLE public.incidencias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en incidencias" ON public.incidencias;
CREATE POLICY "Permitir todo en incidencias" ON public.incidencias FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_incidencias_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS 
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
;

DROP TRIGGER IF EXISTS update_incidencias_updated_at ON public.incidencias;
CREATE TRIGGER update_incidencias_updated_at
  BEFORE UPDATE ON public.incidencias
  FOR EACH ROW
  EXECUTE FUNCTION public.update_incidencias_updated_at();
