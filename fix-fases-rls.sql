-- SQL para bucket y policy de documentos de solicitudes
-- Ejecutar en Supabase Dashboard → SQL Editor

-- 1. Crear bucket de storage (si no existe, hacerlo desde el Dashboard: Storage → New bucket "solicitudes-documentos")
-- 2. Política RLS para que anon pueda subir y leer

-- Enable RLS on storage.objects if needed
-- (Esto es manejado desde el Dashboard → Storage → Policies)

-- Verificar buckets
SELECT id, name, public FROM storage.buckets;

-- Si el bucket no existe, créalo:
INSERT INTO storage.buckets (id, name, public) VALUES ('solicitudes-documentos', 'solicitudes-documentos', false);

-- Política para lectura (anon puede leer)
CREATE POLICY "Allow anon read" ON storage.objects
  FOR SELECT USING (bucket_id = 'solicitudes-documentos');

-- Política para subida (anon puede subir)  
CREATE POLICY "Allow anon upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'solicitudes-documentos');

-- Política para actualización/eliminación
CREATE POLICY "Allow anon update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'solicitudes-documentos');

CREATE POLICY "Allow anon delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'solicitudes-documentos');