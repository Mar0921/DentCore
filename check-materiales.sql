-- 1. Verificar si la tabla materiales existe y su estructura
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'materiales'
ORDER BY ordinal_position;

-- 2. Verificar datos en la tabla (para el laboratorio actual)
-- Reemplaza 'TU_LABORATORIO_ID' con el valor real de localStorage.getItem('labId')
SELECT * FROM materiales WHERE laboratorio_id = 'TU_LABORATORIO_ID' ORDER BY created_at DESC;

-- 3. Verificar todas las filas (sin filtro de laboratorio)
SELECT * FROM materiales ORDER BY created_at DESC;

-- 4. Verificar políticas RLS en la tabla materiales
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'materiales';

-- 5. Verificar si RLS está habilitado
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'materiales';

-- 6. Si no hay datos, insertar datos de prueba (reemplaza TU_LABORATORIO_ID)
INSERT INTO materiales (laboratorio_id, codigo, nombre, numero_lote, categoria, tipo_material, marca_fabricante, ref_fabricante, material, producto, proveedor, archivo_url)
VALUES 
  ('TU_LABORATORIO_ID', 'MAT-001', 'Resina Dental 3D', 'LOTE-2024-001', 'Resina', 'Resina', 'Formlabs', 'FL-DENT-001', 'Resina fotopolimerizable', 'Modelos dentales', 'Dental Supply Co', NULL),
  ('TU_LABORATORIO_ID', 'MAT-002', 'Zirconio Multicapa', 'LOTE-2024-002', 'Zirconio', 'Zirconio', 'Kuraray Noritake', 'KN-ZIR-001', 'Óxido de zirconio', 'Coronas y puentes', 'Kuraray Dental', NULL),
  ('TU_LABORATORIO_ID', 'MAT-003', 'Disilicato de Litio', 'LOTE-2024-003', 'Ceramica', 'Disilicato', 'Ivoclar Vivadent', 'IV-EMAX-001', 'Disilicato de litio', 'Carillas y coronas', 'Ivoclar', NULL)
ON CONFLICT DO NOTHING;

-- 7. Deshabilitar RLS temporalmente para testing (¡solo para desarrollo!)
-- ALTER TABLE materiales DISABLE ROW LEVEL SECURITY;

-- 8. Habilitar RLS de nuevo después de testing
-- ALTER TABLE materiales ENABLE ROW LEVEL SECURITY;

-- 9. Crear política permisiva para testing (¡solo para desarrollo!)
-- CREATE POLICY "Allow all for testing" ON materiales FOR ALL USING (true) WITH CHECK (true);