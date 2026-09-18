-- Enriquecimiento de solicitudes: captura de datos del paciente, fecha de entrega,
-- firma del odontólogo y fase actual del proceso productivo (para derivar el progreso).
-- Usa ADD COLUMN IF NOT EXISTS para ser idempotente.

-- Datos del paciente
ALTER TABLE "public"."solicitudes" ADD COLUMN IF NOT EXISTS "paciente" TEXT;
ALTER TABLE "public"."solicitudes" ADD COLUMN IF NOT EXISTS "cc_paciente" TEXT;

-- Fecha de entrega (texto formateado dd/mm/aaaa, coherente con fechaElaboracion)
ALTER TABLE "public"."solicitudes" ADD COLUMN IF NOT EXISTS "fecha_entrega" TEXT;

-- Firma del odontólogo (data URL)
ALTER TABLE "public"."solicitudes" ADD COLUMN IF NOT EXISTS "firma_odontologo" TEXT;

-- Fase actual dentro del proceso productivo (referencia a fases.id).
-- El progreso de la solicitud se deriva del orden de la fase.
ALTER TABLE "public"."solicitudes" ADD COLUMN IF NOT EXISTS "fase_id" UUID REFERENCES "public"."fases" ("id") ON DELETE SET NULL;

-- Asegura que el nombre del paciente sea indexable para búsquedas
CREATE INDEX IF NOT EXISTS "solicitudes_paciente_idx" ON "public"."solicitudes" ("paciente");
CREATE INDEX IF NOT EXISTS "solicitudes_fase_id_idx" ON "public"."solicitudes" ("fase_id");
