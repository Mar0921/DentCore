-- Permitir updates en solicitudes (estado de cuenta / factura)
ALTER TABLE public.solicitudes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir update solicitudes" ON public.solicitudes;
CREATE POLICY "Permitir update solicitudes" ON public.solicitudes FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Permitir select solicitudes" ON public.solicitudes;
CREATE POLICY "Permitir select solicitudes" ON public.solicitudes FOR SELECT USING (true);
