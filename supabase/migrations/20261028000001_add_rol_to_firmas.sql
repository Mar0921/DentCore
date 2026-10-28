-- Actualizar tabla firmas para incluir rol del profesional
ALTER TABLE public.firmas ADD COLUMN IF NOT EXISTS rol text;

-- Comentarios para documentación
COMMENT ON TABLE public.firmas IS 'Firmas digitales de profesionales del laboratorio para usar en documentos';
COMMENT ON COLUMN public.firmas.nombre IS 'Nombre completo del profesional';
COMMENT ON COLUMN public.firmas.titulo IS 'Título o cargo (opcional)';
COMMENT ON COLUMN public.firmas.rol IS 'Rol del profesional en el laboratorio (ej. Técnico, Protesista, Director Técnico)';
COMMENT ON COLUMN public.firmas.firma_data_url IS 'Firma dibujada en formato data URL (PNG)';
COMMENT ON COLUMN public.firmas.laboratorio_id IS 'ID del laboratorio al que pertenece';
COMMENT ON COLUMN public.firmas.activo IS 'Indica si la firma está activa para su uso';
