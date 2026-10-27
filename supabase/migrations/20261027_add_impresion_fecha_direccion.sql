ALTER TABLE "public"."solicitudes" ADD COLUMN IF NOT EXISTS "impresion_tipo" TEXT;
ALTER TABLE "public"."solicitudes" ADD COLUMN IF NOT EXISTS "fecha_elaboracion" TEXT;
ALTER TABLE "public"."solicitudes" ADD COLUMN IF NOT EXISTS "direccion" TEXT;
