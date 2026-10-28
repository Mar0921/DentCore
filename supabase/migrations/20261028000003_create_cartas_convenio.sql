-- Tabla para guardar cartas convenio firmadas
CREATE TABLE IF NOT EXISTS public.cartas_convenio (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  laboratorio_id uuid REFERENCES public.laboratorio(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES public.cliente(id) ON DELETE CASCADE,
  firma_odontologo_data_url text,
  fecha_firma timestamp with time zone,
  firmado boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cartas_convenio_laboratorio ON public.cartas_convenio(laboratorio_id);
CREATE INDEX IF NOT EXISTS idx_cartas_convenio_cliente ON public.cartas_convenio(cliente_id);

CREATE OR REPLACE FUNCTION public.update_cartas_convenio_updated_at()
RETURNS TRIGGER AS 
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
 LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_cartas_convenio_updated_at ON public.cartas_convenio;
CREATE TRIGGER update_cartas_convenio_updated_at
  BEFORE UPDATE ON public.cartas_convenio
  FOR EACH ROW
  EXECUTE FUNCTION public.update_cartas_convenio_updated_at();

ALTER TABLE public.cartas_convenio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo cartas_convenio" ON public.cartas_convenio FOR ALL USING (true) WITH CHECK (true);
