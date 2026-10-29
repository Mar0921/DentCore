-- Tabla de evidencias (fotos) de fases de fabricación
CREATE TABLE IF NOT EXISTS "public"."fases_evidencias" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "solicitud_id" UUID REFERENCES "public"."solicitudes"("id") ON DELETE CASCADE,
  "producto_fase_id" UUID REFERENCES "public"."producto_fases"("id") ON DELETE CASCADE,
  "fase_id" UUID REFERENCES "public"."fases"("id") ON DELETE SET NULL,
  "laboratorio_id" UUID REFERENCES "public"."laboratorio"("id") ON DELETE SET NULL,
  "empleado_id" UUID REFERENCES "public"."empleados"("id") ON DELETE SET NULL,
  "archivo_url" TEXT NOT NULL,
  "nombre_archivo" TEXT NOT NULL,
  "tipo_mime" TEXT,
  "tamaño_bytes" BIGINT,
  "creado_en" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "fases_evidencias_solicitud_id_idx" ON "public"."fases_evidencias" ("solicitud_id");
CREATE INDEX IF NOT EXISTS "fases_evidencias_producto_fase_id_idx" ON "public"."fases_evidencias" ("producto_fase_id");

-- Habilitar RLS
ALTER TABLE "public"."fases_evidencias" ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso (ajustar según necesidades)
CREATE POLICY "Allow authenticated read" ON "public"."fases_evidencias"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON "public"."fases_evidencias"
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON "public"."fases_evidencias"
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON "public"."fases_evidencias"
  FOR DELETE TO authenticated USING (true);

-- Bucket de storage para evidencias de fases
INSERT INTO storage.buckets (id, name, public) VALUES ('fases-evidencias', 'fases-evidencias', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow anon read fases-evidencias" ON storage.objects
  FOR SELECT USING (bucket_id = 'fases-evidencias');

CREATE POLICY "Allow anon upload fases-evidencias" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'fases-evidencias');

CREATE POLICY "Allow anon update fases-evidencias" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'fases-evidencias');

CREATE POLICY "Allow anon delete fases-evidencias" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'fases-evidencias');
