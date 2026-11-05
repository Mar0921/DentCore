-- Corrige el check constraint solicitudes_estado_check para que coincida
-- con ESTADO_OPTIONS del frontend (pendiente, en_progreso, completada, entregada, cancelada).
-- El constraint previo (no versionado) rechazaba valores que la app guarda, causando
-- "new row for relation solicitudes violates check constraint solicitudes_estado_check".

-- 1) Quitar el constraint existente si hay uno con nombre distinto o el mismo
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'solicitudes_estado_check'
      AND conrelid = 'public.solicitudes'::regclass
  ) THEN
    ALTER TABLE public.solicitudes DROP CONSTRAINT solicitudes_estado_check;
  END IF;
END $$;

-- 2) Sanear datos existentes: poner 'pendiente' en filas con estado fuera de la lista valida
UPDATE public.solicitudes
SET estado = 'pendiente'
WHERE estado IS NOT NULL
  AND estado NOT IN ('pendiente', 'en_progreso', 'completada', 'entregada', 'cancelada');

-- 3) Recrear el constraint con los valores permitidos por la app
ALTER TABLE public.solicitudes
  ADD CONSTRAINT solicitudes_estado_check
  CHECK (estado IN ('pendiente', 'en_progreso', 'completada', 'entregada', 'cancelada'));
