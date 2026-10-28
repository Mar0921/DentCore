-- Agregar columnas de factura y comprobante a solicitudes
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS factura_url text;
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS comprobante_url text;
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS estado_pago text DEFAULT 'pendientePago';
