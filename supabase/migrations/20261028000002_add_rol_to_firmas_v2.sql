-- Agregar rol del profesional a la tabla firmas
ALTER TABLE public.firmas ADD COLUMN IF NOT EXISTS rol text;

-- Comentarios
COMMENT ON COLUMN public.firmas.nombre IS 'Nombre completo del profesional del laboratorio';
COMMENT ON COLUMN public.firmas.rol IS 'Rol/cargo del profesional (Técnico, Protésico, Director Técnico, etc.)';
COMMENT ON COLUMN public.firmas.titulo IS 'Título académico o cargo adicional (opcional)';
COMMENT ON COLUMN public.firmas.firma_data_url IS 'Imagen de la firma en formato data URL PNG';
