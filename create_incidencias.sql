CREATE OR REPLACE FUNCTION public.update_incidencias_updated_at()
RETURNS TRIGGER AS 
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
 LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_incidencias_updated_at ON public.incidencias;
CREATE TRIGGER update_incidencias_updated_at
  BEFORE UPDATE ON public.incidencias
  FOR EACH ROW
  EXECUTE FUNCTION public.update_incidencias_updated_at();
