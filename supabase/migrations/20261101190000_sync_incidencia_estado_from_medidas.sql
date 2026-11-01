-- Sincronizar estado de incidencia con la última medida aplicada
CREATE OR REPLACE FUNCTION public.sync_incidencia_estado_from_ultima_medida()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_incidencia_id uuid;
  v_ultimo_estado text;
  v_nuevo_estado text;
BEGIN
  v_incidencia_id := COALESCE(NEW.incidencia_id, OLD.incidencia_id);

  SELECT estado
  INTO v_ultimo_estado
  FROM public.incidencia_medidas
  WHERE incidencia_id = v_incidencia_id
  ORDER BY created_at DESC, id DESC
  LIMIT 1;

  IF v_ultimo_estado IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  v_ultimo_estado := lower(trim(v_ultimo_estado));

  IF v_ultimo_estado IN ('resuelta', 'aplicada', 'cerrada') THEN
    v_nuevo_estado := 'cerrada';
  ELSIF v_ultimo_estado = 'en_proceso' THEN
    v_nuevo_estado := 'en_proceso';
  ELSE
    v_nuevo_estado := 'abierta';
  END IF;

  UPDATE public.incidencias
  SET estado = v_nuevo_estado,
      updated_at = now()
  WHERE id = v_incidencia_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS sync_incidencia_estado_after_medida ON public.incidencia_medidas;

CREATE TRIGGER sync_incidencia_estado_after_medida
AFTER INSERT OR UPDATE OR DELETE ON public.incidencia_medidas
FOR EACH ROW
EXECUTE FUNCTION public.sync_incidencia_estado_from_ultima_medida();
