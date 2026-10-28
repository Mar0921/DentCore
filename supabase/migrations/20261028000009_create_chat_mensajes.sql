-- Crear tabla de conversaciones
CREATE TABLE IF NOT EXISTS public.conversaciones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  laboratorio_id uuid REFERENCES public.laboratorio(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES public.cliente(id) ON DELETE CASCADE,
  solicitud_id uuid REFERENCES public.solicitudes(id) ON DELETE SET NULL,
  asunto text,
  ultimo_mensaje_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Crear tabla de mensajes
CREATE TABLE IF NOT EXISTS public.mensajes_chat (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversacion_id uuid REFERENCES public.conversaciones(id) ON DELETE CASCADE NOT NULL,
  remitente_tipo text NOT NULL CHECK (remitente_tipo IN ('laboratorio', 'cliente', 'empleado')),
  remitente_id uuid,
  contenido text NOT NULL,
  tipo text DEFAULT 'texto' CHECK (tipo IN ('texto', 'imagen', 'archivo')),
  archivo_url text,
  archivo_nombre text,
  leido boolean DEFAULT false,
  leido_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_conversaciones_laboratorio ON public.conversaciones(laboratorio_id);
CREATE INDEX IF NOT EXISTS idx_conversaciones_cliente ON public.conversaciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_conversaciones_solicitud ON public.conversaciones(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_chat_conversacion ON public.mensajes_chat(conversacion_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_chat_created ON public.mensajes_chat(created_at);

-- Trigger para actualizar updated_at en conversaciones
CREATE OR REPLACE FUNCTION public.update_conversaciones_updated_at()
RETURNS TRIGGER AS 
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
 LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_conversaciones_updated_at ON public.conversaciones;
CREATE TRIGGER update_conversaciones_updated_at
  BEFORE UPDATE ON public.conversaciones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversaciones_updated_at();

-- Actualizar ultimo_mensaje_at cuando se inserta mensaje
CREATE OR REPLACE FUNCTION public.update_conversacion_ultimo_mensaje()
RETURNS TRIGGER AS 
BEGIN
  UPDATE public.conversaciones
  SET ultimo_mensaje_at = NEW.created_at,
      updated_at = NEW.created_at
  WHERE id = NEW.conversacion_id;
  RETURN NEW;
END;
 LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_conversacion_ultimo_mensaje ON public.mensajes_chat;
CREATE TRIGGER update_conversacion_ultimo_mensaje
  AFTER INSERT ON public.mensajes_chat
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversacion_ultimo_mensaje();

-- RLS
ALTER TABLE public.conversaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensajes_chat ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Permitir todo en conversaciones" ON public.conversaciones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en mensajes_chat" ON public.mensajes_chat FOR ALL USING (true) WITH CHECK (true);
