-- Columnas completas para tabla materiales (basado en tu lista)
-- Ejecuta en SQL Editor de Supabase

-- 1. Ver columnas actuales
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'materiales'
ORDER BY ordinal_position;

-- 2. Agregar TODAS las columnas faltantes (sin duplicar las existentes)
ALTER TABLE materiales 
-- Identificación
ADD COLUMN IF NOT EXISTS codigo_interno TEXT,
ADD COLUMN IF NOT EXISTS nombre_materia_prima TEXT,  -- ya existe como 'nombre'

-- Cantidad y FIFO
ADD COLUMN IF NOT EXISTS cantidad_entrada NUMERIC(10,3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS aplica_fifo BOOLEAN DEFAULT true,

-- Referencia y marca
ADD COLUMN IF NOT EXISTS codigo_referencia TEXT,  -- ya existe como 'ref_fabricante'
ADD COLUMN IF NOT EXISTS marca TEXT,  -- ya existe como 'marca_fabricante'

-- Proveedor
ADD COLUMN IF NOT EXISTS proveedor TEXT,  -- ya existe
ADD COLUMN IF NOT EXISTS domicilio_proveedor TEXT,
ADD COLUMN IF NOT EXISTS registro_invima TEXT,
ADD COLUMN IF NOT EXISTS invima_vigente BOOLEAN,

-- Lotes
ADD COLUMN IF NOT EXISTS lote_fabricante TEXT,  -- ya existe como 'numero_lote'
ADD COLUMN IF NOT EXISTS lote_recepcion TEXT,  -- generado si no hay lote fabricante (ddmmyyyy)

-- Fechas
ADD COLUMN IF NOT EXISTS fecha_ingreso DATE,  -- ya existe como 'created_at' / 'fecha_recepcion'
ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE,  -- ya existe
ADD COLUMN IF NOT EXISTS fecha_apertura DATE,
ADD COLUMN IF NOT EXISTS fecha_cierre DATE,

-- Cálculos FEFO
ADD COLUMN IF NOT EXISTS dias_faltantes_vencimiento INTEGER,
ADD COLUMN IF NOT EXISTS aplica_fefo BOOLEAN DEFAULT true,

-- Almacenamiento y condiciones
ADD COLUMN IF NOT EXISTS forma_almacenamiento TEXT,
ADD COLUMN IF NOT EXISTS condiciones_fisicas TEXT,
ADD COLUMN IF NOT EXISTS estado_aceptacion TEXT DEFAULT 'pendiente' CHECK (estado_aceptacion IN ('pendiente', 'aceptado', 'rechazado', 'cuarentena')),

-- Responsables
ADD COLUMN IF NOT EXISTS responsable_inspeccion TEXT,
ADD COLUMN IF NOT EXISTS responsable_recepcion TEXT,  -- ya existe

-- Documentación
ADD COLUMN IF NOT EXISTS documentos_recepcion TEXT,  -- JSON array de URLs
ADD COLUMN IF NOT EXISTS ficha_seguridad_url TEXT,
ADD COLUMN IF NOT EXISTS ficha_tecnica_url TEXT,

-- Estado general (ya existe 'estado' pero con otros valores)
ADD COLUMN IF NOT EXISTS estado_general TEXT DEFAULT 'pendiente' CHECK (estado_general IN ('pendiente', 'recibido', 'en_uso', 'agotado', 'vencido', 'desechado', 'cuarentena')),
ADD COLUMN IF NOT EXISTS ubicacion_almacen TEXT,  -- ya existe
ADD COLUMN IF NOT EXISTS unidad_medida TEXT DEFAULT 'unidad',  -- ya existe
ADD COLUMN IF NOT EXISTS observaciones TEXT;  -- ya existe

-- 3. Verificar columnas finales
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'materiales'
ORDER BY ordinal_position;