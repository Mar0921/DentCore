-- Permitir lectura de cartas_convenio para laboratorio
DROP POLICY IF EXISTS \"Permitir todo cartas_convenio\" ON public.cartas_convenio;

CREATE POLICY \"Laboratorio puede ver cartas_convenio\" ON public.cartas_convenio
  FOR SELECT USING (true);

CREATE POLICY \"Permitir insertar cartas_convenio\" ON public.cartas_convenio
  FOR INSERT WITH CHECK (true);

CREATE POLICY \"Permitir actualizar cartas_convenio\" ON public.cartas_convenio
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY \"Permitir eliminar cartas_convenio\" ON public.cartas_convenio
  FOR DELETE USING (true);
