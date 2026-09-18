-- Tabla para encuesta POS ADAPTACION
CREATE TABLE IF NOT EXISTS public.encuestas_pos_adaptacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id TEXT NULL,
  profesional_email TEXT NULL,
  nombre_paciente TEXT NULL,
  buena_adaptacion_inicial BOOLEAN NULL,
  adecuada_estetica BOOLEAN NULL,
  ajuste_oclusal_adecuado BOOLEAN NULL,
  color_adecuado BOOLEAN NULL,
  opinion_general TEXT NULL,
  dispositivo_cumple_fines TEXT NULL,
  paciente_conforme TEXT NULL,
  nombre_profesional TEXT NULL,
  fecha_entrega_paciente DATE NULL,
  created_at TIMESTAMP NULL DEFAULT now(),
  updated_at TIMESTAMP NULL DEFAULT now()
);

-- Tabla para buzon de quejas/reclamos/sugerencias/felicitaciones
CREATE TABLE IF NOT EXISTS public.buzon_quejas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id TEXT NULL,
  tipo TEXT NULL,
  descripcion TEXT NULL,
  notificacion_email BOOLEAN NULL DEFAULT false,
  notificacion_whatsapp BOOLEAN NULL DEFAULT false,
  notificacion_presencial BOOLEAN NULL DEFAULT false,
  nombre_apellido TEXT NULL,
  correo_electronico TEXT NULL,
  comentarios_adicionales TEXT NULL,
  estado TEXT NULL DEFAULT 'pendiente',
  created_at TIMESTAMP NULL DEFAULT now(),
  updated_at TIMESTAMP NULL DEFAULT now()
);
