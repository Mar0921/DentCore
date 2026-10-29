'use client'

import { useState, useEffect, useRef } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

interface ChatWidgetProps {
  tipo: 'cliente' | 'laboratorio'
  clienteId?: string
  laboratorioId?: string
  solicitudId?: string
}

export function ChatWidget({ tipo, clienteId, laboratorioId, solicitudId }: ChatWidgetProps) {
  const [open, setOpen] = useState(true)
  const [conversacion, setConversacion] = useState<any>(null)
  const [mensajes, setMensajes] = useState<any[]>([])
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!conversacion && clienteId && laboratorioId) {
      initChat()
    }
    if (conversacion) {
      loadMensajes()
      const interval = setInterval(loadMensajes, 3000)
      return () => clearInterval(interval)
    }
  }, [conversacion, clienteId, laboratorioId])

  useEffect(() => { scrollToBottom() }, [mensajes])

  async function initChat() {
    if (tipo === 'cliente' && clienteId && laboratorioId) {
      setLoading(true)
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'crear_conversacion', laboratorio_id: laboratorioId, cliente_id: clienteId, solicitud_id: solicitudId || null, asunto: 'Consulta desde portal cliente' })
        })
        const { data } = await res.json()
        setConversacion(data)
      } catch (err) { console.error(err) } finally { setLoading(false) }
    }
  }

  async function loadMensajes() {
    if (!conversacion) return
    try {
      const res = await fetch('/api/chat?conversacion_id=' + conversacion.id)
      const { data } = await res.json()
      setMensajes(data || [])
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'marcar_leido', conversacion_id: conversacion.id, remitente_tipo: tipo })
      })
    } catch (err) { console.error(err) }
  }

  async function enviarMensaje() {
    if (!mensaje.trim() || !conversacion) return
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enviar_mensaje', conversacion_id: conversacion.id, remitente_tipo: tipo, remitente_id: tipo === 'cliente' ? clienteId : laboratorioId, contenido: mensaje })
      })
      setMensaje('')
      loadMensajes()
    } catch (err) { console.error(err) }
  }

  function scrollToBottom() { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className='rounded-full h-14 w-14 shadow-lg' size='icon'>
        <MessageCircle className='h-6 w-6' />
      </Button>
    )
  }

  return (
    <Card className='w-full max-w-2xl h-[600px] flex flex-col shadow-xl mx-auto'>
      <div className='flex items-center justify-between p-3 border-b bg-primary text-primary-foreground'>
        <div>
          <p className='font-medium text-sm'>Chat con Laboratorio</p>
          <p className='text-xs opacity-90'>Soporte y consultas</p>
        </div>
      </div>
      <div className='flex-1 overflow-y-auto p-3 space-y-2'>
        {loading && <p className='text-center text-xs text-muted-foreground'>Iniciando chat...</p>}
        {mensajes.map((msg: any) => (
          <div key={msg.id} className={'flex ' + (msg.remitente_tipo === tipo ? 'justify-end' : 'justify-start')}>
            <div className={'max-w-[70%] p-2 rounded-lg text-xs ' + (msg.remitente_tipo === tipo ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                <p>{msg.contenido?.startsWith('Archivo: ') ? <a href={msg.contenido.replace('Archivo: ', '')} target='_blank' rel='noopener noreferrer' className='underline'>Ver archivo</a> : msg.contenido}</p>
              <p className='text-[10px] opacity-70 mt-1'>{new Date(msg.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className='p-3 border-t flex gap-2'>
        <Input value={mensaje} onChange={(e) => setMensaje(e.target.value)} placeholder='Escribe un mensaje...' className='text-xs' onKeyPress={(e) => e.key === 'Enter' && enviarMensaje()} />
        <Button size='icon' onClick={enviarMensaje} className='h-8 w-8'><Send className='h-4 w-4' /></Button>
      </div>
    </Card>
  )
}
