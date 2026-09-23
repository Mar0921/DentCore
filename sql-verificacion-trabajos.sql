-- SQL de verificación para Trabajos / Solicitudes
-- Ejecutar en Supabase Dashboard → SQL Editor

-- 1. Verifica que la tabla solicitudes tenga datos
SELECT 
  COUNT(*) as total_solicitudes,
  COUNT(fecha_entrega) as con_fecha_entrega,
  COUNT(codigo_trazabilidad) as con_codigo
FROM solicitudes;

-- 2. Ver solicitudes con fecha de entrega (ordenadas por más reciente)
SELECT 
  id,
  codigo_trazabilidad,
  paciente,
  estado,
  prioridad,
  fecha_entrega,
  fase_id,
  asignado_a,
  laboratorio_id,
  created_at
FROM solicitudes
WHERE fecha_entrega IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;

-- 3. Verifica que la tabla fases tenga datos
SELECT COUNT(*) as total_fases FROM fases;

-- 4. Verifica que la tabla empleados tenga el email del empleado
SELECT id, nombre, email, rol FROM empleados ORDER BY nombre LIMIT 20;

-- 5. Verifica permisos (RLS) en solicitudes
SELECT schemaname, tablename, rls_enabled, rls_force_row_level_security
FROM pg_tables
WHERE tablename = 'solicitudes';

-- 6. Si RLS está activado y no ves datos, ejecuta este policy:
-- ALTER TABLE public.solicitudes ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow anon select" ON public.solicitudes
--   FOR SELECT USING (laboratorio_id IS NOT NULL);
-- CREATE POLICY "Allow anon insert" ON public.solicitudes
--   FOR INSERT WITH CHECK (laboratorio_id IS NOT NULL);
