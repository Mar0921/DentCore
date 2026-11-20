-- Columnas a agregar a la tabla materiales (se llenan DESPUÉS de crear el material)
-- Ejecuta en SQL Editor de Supabase

-- 1. Ver columnas actuales
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'materiales'
ORDER BY ordinal_position;

-- 2. Agregar columnas para gestión post-creación
ALTER TABLE materiales 
ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'recibido', 'en_uso', 'agotado', 'vencido', 'desechado')),
ADD COLUMN IF NOT EXISTS fecha_recepcion DATE,
ADD COLUMN IF NOT EXISTS cantidad NUMERIC(10,3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS unidad_medida TEXT DEFAULT 'unidad',
ADD COLUMN IF NOT EXISTS ubicacion_almacen TEXT,
ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE,
ADD COLUMN IF NOT EXISTS observaciones TEXT,
ADD COLUMN IF NOT EXISTS responsable_recepcion TEXT,
ADD COLUMN IF NOT EXISTS costo_unitario NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS moneda TEXT DEFAULT 'COP';

-- 3. Verificar que se agregaron
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'materiales'
ORDER BY ordinal_position;