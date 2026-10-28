-- Tabla para almacenar firmas de profesionales del laboratorio
CREATE TABLE IF NOT EXISTS public.firmas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  laboratorio_id uuid REFERENCES public.laboratorio(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  titulo text,
  firma_data_url text NOT NULL,
  activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_firmas_laboratorio_id ON public.firmas(laboratorio_id);
CREATE INDEX IF NOT EXISTS idx_firmas_activo ON public.firmas(activo);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_firmas_updated_at()
RETURNS TRIGGER AS 
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
 LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_firmas_updated_at ON public.firmas;
CREATE TRIGGER update_firmas_updated_at
  BEFORE UPDATE ON public.firmas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_firmas_updated_at();

-- RLS
ALTER TABLE public.firmas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver firmas de su laboratorio" ON public.firmas
  FOR SELECT USING (
    laboratorio_id IN (
      SELECT laboratorio_id FROM public.empleados WHERE email = auth.jwt() ->> 'email'
      UNION
      SELECT id FROM public.laboratorio WHERE email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Usuarios pueden crear firmas en su laboratorio" ON public.firmas
  FOR INSERT WITH CHECK (
    laboratorio_id IN (
      SELECT laboratorio_id FROM public.empleados WHERE email = auth.jwt() ->> 'email'
      UNION
      SELECT id FROM public.laboratorio WHERE email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Usuarios pueden actualizar firmas de su laboratorio" ON public.firmas
  FOR UPDATE USING (
    laboratorio_id IN (
      SELECT laboratorio_id FROM public.empleados WHERE email = auth.jwt() ->> 'email'
      UNION
      SELECT id FROM public.laboratorio WHERE email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Usuarios pueden eliminar firmas de su laboratorio" ON public.firmas
  FOR DELETE USING (
    laboratorio_id IN (
      SELECT laboratorio_id FROM public.empleados WHERE email = auth.jwt() ->> 'email'
      UNION
      SELECT id FROM public.laboratorio WHERE email = auth.jwt() ->> 'email'
    )
  );
