-- Agrega columnas de detalle de solicitud que faltan en la tabla public.solicitudes.
-- Usa ADD COLUMN IF NOT EXISTS para ser idempotente.

ALTER TABLE "public"."solicitudes" ADD COLUMN IF NOT EXISTS "registro_medico" TEXT;
ALTER TABLE "public"."solicitudes" ADD COLUMN IF NOT EXISTS "historia_clinica" TEXT;
ALTER TABLE "public"."solicitudes" ADD COLUMN IF NOT EXISTS "indicaciones" TEXT;
ALTER TABLE "public"."solicitudes" ADD COLUMN IF NOT EXISTS "color" TEXT;
ALTER TABLE "public"."solicitudes" ADD COLUMN IF NOT EXISTS "guia" TEXT;
ALTER TABLE "public"."solicitudes" ADD COLUMN IF NOT EXISTS "codigo_trazabilidad" TEXT;
ALTER TABLE "public"."solicitudes" ADD COLUMN IF NOT EXISTS "productos" TEXT;
ALTER TABLE "public"."solicitudes" ADD COLUMN IF NOT EXISTS "piezas_enviadas" TEXT;
ALTER TABLE "public"."solicitudes" ADD COLUMN IF NOT EXISTS "archivos" TEXT[];
