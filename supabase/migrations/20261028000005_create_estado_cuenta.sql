-- Tabla para estado de cuenta del invitado al laboratorio
CREATE TABLE IF NOT EXISTS public.estado_cuenta (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  laboratorio_id uuid REFERENCES public.laboratorio(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES public.cliente(id) ON DELETE CASCADE,
  solicitud_id uuid REFERENCES public.solicitudes(id) ON DELETE CASCADE,
  servicio text NOT NULL,
  solicitud_numero text,
  fecha date,
  estado text DEFAULT 'en proceso',
  estado_pago text DEFAULT 'pendientePago',
  factura_url text,
  comprobante_url text,
  precio numeric(12,2) DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_estado_cuenta_cliente ON public.estado_cuenta(cliente_id);
CREATE INDEX IF NOT EXISTS idx_estado_cuenta_solicitud ON public.estado_cuenta(solicitud_id);

CREATE OR REPLACE FUNCTION public.update_estado_cuenta_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_estado_cuenta_updated_at ON public.estado_cuenta;
CREATE TRIGGER update_estado_cuenta_updated_at
  BEFORE UPDATE ON public.estado_cuenta
  FOR EACH ROW
  EXECUTE FUNCTION public.update_estado_cuenta_updated_at();

ALTER TABLE public.estado_cuenta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo estado_cuenta" ON public.estado_cuenta FOR ALL USING (true) WITH CHECK (true);
