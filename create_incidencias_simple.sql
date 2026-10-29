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
  estado text DEFAULT 'abierta',
  fecha_creacion timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.incidencias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS \"Permitir todo en incidencias\" ON public.incidencias;
CREATE POLICY \"Permitir todo en incidencias\" ON public.incidencias FOR ALL USING (true) WITH CHECK (true);
