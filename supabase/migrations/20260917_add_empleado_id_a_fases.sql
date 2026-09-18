-- Añade empleado_id y laboratorio_id a la tabla fases (asignación de fases a empleados
-- y fases vinculadas a cada laboratorio). Usa ALTER ... IF NOT EXISTS por si la tabla ya existe.
-- La inserción usa WHERE NOT EXISTS para ser idempotente SIN requerir constraint único.

-- Columna para asignar una fase a un empleado
ALTER TABLE "public"."fases" ADD COLUMN IF NOT EXISTS "empleado_id" uuid REFERENCES "public"."empleados" ("id") ON DELETE SET NULL;

-- Columna para vincular fases a un laboratorio
ALTER TABLE "public"."fases" ADD COLUMN IF NOT EXISTS "laboratorio_id" uuid;

-- Inserta las 24 fases proceso (solo si aún no existen).
INSERT INTO "public"."fases" ("nombre", "orden", "color", "descripcion")
SELECT * FROM (
  VALUES
    ('LIMPIEZA Y DESINFECCION DE ENTRADA', 1, 'bg-secondary/30 text-secondary-foreground', ''),
    ('VACEADO Y PREPARACION MODELOS', 2, 'bg-secondary/30 text-secondary-foreground', ''),
    ('PLATO BASE Y RODETE', 3, 'bg-secondary/30 text-secondary-foreground', ''),
    ('ESCANEO Y DISEÑO', 4, 'bg-secondary/30 text-secondary-foreground', ''),
    ('DISEÑO DE MODELO 3D', 5, 'bg-secondary/30 text-secondary-foreground', ''),
    ('LIBERADO Y PULIDO DE META EXTERNALIZADO', 6, 'bg-secondary/30 text-secondary-foreground', ''),
    ('CONTROL DE CALIDAD DE PROCESO 1', 7, 'bg-secondary/30 text-secondary-foreground', ''),
    ('IMPRESION RESINA', 8, 'bg-secondary/30 text-secondary-foreground', ''),
    ('FRESADO ZR-DSL-PMMA', 9, 'bg-secondary/30 text-secondary-foreground', ''),
    ('FRESADO CERA', 10, 'bg-secondary/30 text-secondary-foreground', ''),
    ('ENCERADO MANUAL', 11, 'bg-secondary/30 text-secondary-foreground', ''),
    ('SINTERIZADO', 12, 'bg-secondary/30 text-secondary-foreground', ''),
    ('IMPRESION 3D', 13, 'bg-secondary/30 text-secondary-foreground', ''),
    ('DISEÑO DE BARRA', 14, 'bg-secondary/30 text-secondary-foreground', ''),
    ('ENFILADO', 15, 'bg-secondary/30 text-secondary-foreground', ''),
    ('CONTROL CALIDAD DE PROCESO 2', 16, 'bg-secondary/30 text-secondary-foreground', ''),
    ('PULIDO DE METAL Y RESINAS', 17, 'bg-secondary/30 text-secondary-foreground', ''),
    ('MICROFRESADO', 18, 'bg-secondary/30 text-secondary-foreground', ''),
    ('FRESADO MONTURA', 19, 'bg-secondary/30 text-secondary-foreground', ''),
    ('REVESTIR + DESENCERAR + INYECTAR', 20, 'bg-secondary/30 text-secondary-foreground', ''),
    ('LIBERADO Y PULIDO LIBRE DE METAL', 21, 'bg-secondary/30 text-secondary-foreground', ''),
    ('MAQUILLAJE Y CERAMICA', 22, 'bg-secondary/30 text-secondary-foreground', ''),
    ('CONTROL DE CALIDAD LIBERACION', 23, 'bg-secondary/30 text-secondary-foreground', ''),
    ('LIMPIEZA Y DESINFECCION DE DISPOSITIVO TERMINADO', 24, 'bg-secondary/30 text-secondary-foreground', '')
) AS v(nombre, orden, color, descripcion)
WHERE NOT EXISTS (SELECT 1 FROM "public"."fases" WHERE nombre = v.nombre);
