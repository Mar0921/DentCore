'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageCircle, Send, Plus, User, Paperclip } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function ChatLaboratorioPageClient() {
  const [conversaciones, setConversaciones] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [conversacionActiva, setConversacionActiva] = useState<any>(null)
  const [mensajes, setMensajes] = useState<any[]>([])
  const [mensaje, setMensaje] = useState('')
  const [laboratorioId, setLaboratorioId] = useState<string | null>(null)
  const [vista, setVista] = useState<'conversaciones' | 'clientes'>('conversaciones')

  useEffect(() => { cargarLaboratorio() }, [])
  useEffect(() => { if (laboratorioId) { cargarConversaciones(); cargarClientes() } }, [laboratorioId])
  useEffect(() => { if (conversacionActiva) { cargarMensajes(); const interval = setInterval(cargarMensajes, 3000); return () => clearInterval(interval) } }, [conversacionActiva])

  async function cargarLaboratorio() {
    const { data: labs } = await supabase.from('laboratorio').select('id').limit(1)
    if (labs && labs[0]) setLaboratorioId(labs[0].id)
  }

  async function cargarConversaciones() {
    const res = await fetch('/api/chat?laboratorio_id=' + laboratorioId)
    const { data } = await res.json()
    setConversaciones(data || [])
  }

  async function cargarClientes() {
    const res = await fetch('/api/chat?laboratorio_id=' + laboratorioId + '&action=clientes')
    const { data } = await res.json()
    setClientes(data || [])
  }

  async function cargarMensajes() {
    if (!conversacionActiva) return
    const res = await fetch('/api/chat?conversacion_id=' + conversacionActiva.id)
    const { data } = await res.json()
    setMensajes(data || [])
    await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'marcar_leido', conversacion_id: conversacionActiva.id, remitente_tipo: 'laboratorio' }) })
  }

  async function iniciarConversacionConCliente(cliente: any) {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'crear_conversacion', laboratorio_id: laboratorioId, cliente_id: cliente.id, asunto: 'Consulta' })
    })
    const { data } = await res.json()
    setConversacionActiva(data)
    await cargarConversaciones()
    setVista('conversaciones')
  }

  const [archivo, setArchivo] = useState<File | null>(null)
  const [enviandoArchivo, setEnviandoArchivo] = useState(false)

  async function enviarArchivo(file: File) {
    if (!conversacionActiva) return
    setEnviandoArchivo(true)
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
      const storagePath = `${conversacionActiva.id}/${Date.now()}-${safeName}`
      const { error: upErr } = await supabase.storage.from('solicitudes-documentos').upload(storagePath, file)
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('solicitudes-documentos').getPublicUrl(storagePath)
      await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'enviar_mensaje', conversacion_id: conversacionActiva.id, remitente_tipo: 'laboratorio', remitente_id: laboratorioId, contenido: `Archivo: ${publicUrl}` }) })
      cargarMensajes()
    } catch (e) { console.error(e) } finally { setEnviandoArchivo(false); setArchivo(null) }
  }
  async function enviarMensaje() {
    if (!mensaje.trim() || !conversacionActiva) return
    await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'enviar_mensaje', conversacion_id: conversacionActiva.id, remitente_tipo: 'laboratorio', remitente_id: laboratorioId, contenido: mensaje }) })
    setMensaje('')
    cargarMensajes()
  }

  return (
    <div className='space-y-4'>
      <div>
        <h1 className='font-heading text-2xl font-bold text-primary flex items-center gap-2'><MessageCircle className='h-6 w-6' /> Chat con Clientes</h1>
        <p className='text-sm text-muted-foreground'>Gestiona las conversaciones con tus clientes</p>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]'>
        <Card className='md:col-span-1 overflow-hidden flex flex-col'>
          <CardHeader className='pb-3 flex flex-row items-center justify-between'>
            <CardTitle className='text-base'>{vista === 'conversaciones' ? 'Conversaciones' : 'Clientes'}</CardTitle>
            <Button size='sm' variant='outline' onClick={() => setVista(vista === 'conversaciones' ? 'clientes' : 'conversaciones')}><Plus className='h-4 w-4 mr-1' /> {vista === 'conversaciones' ? 'Nuevo' : 'Volver'}</Button>
          </CardHeader>
          <CardContent className='flex-1 overflow-y-auto p-0'>
            {vista === 'conversaciones' ? (
              conversaciones.length === 0 ? (<p className='text-xs text-muted-foreground p-3'>No hay conversaciones</p>) :
              conversaciones.map((conv: any) => (
                <div key={conv.id} onClick={() => setConversacionActiva(conv)} className={'p-3 border-b cursor-pointer hover:bg-muted/50 ' + (conversacionActiva?.id === conv.id ? 'bg-muted' : '')}>
                  <p className='font-medium text-sm'>{conv.cliente?.nombre || 'Cliente'}</p>
                  <p className='text-xs text-muted-foreground truncate'>{conv.asunto}</p>
                  <p className='text-xs text-muted-foreground'>{conv.ultimo_mensaje_at ? new Date(conv.ultimo_mensaje_at).toLocaleDateString('es-ES') : ''}</p>
                </div>
              ))
            ) : (
              clientes.length === 0 ? (<p className='text-xs text-muted-foreground p-3'>No hay clientes registrados</p>) :
              clientes.map((cliente: any) => (
                <div key={cliente.id} onClick={() => iniciarConversacionConCliente(cliente)} className='p-3 border-b cursor-pointer hover:bg-muted/50 flex items-center gap-2'>
                  <User className='h-4 w-4 text-muted-foreground' />
                  <div>
                    <p className='font-medium text-sm'>{cliente.nombre}</p>
                    <p className='text-xs text-muted-foreground'>{cliente.email}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card className='md:col-span-2 overflow-hidden flex flex-col'>
          <CardHeader className='pb-3'><CardTitle className='text-base'>{conversacionActiva ? (conversacionActiva.cliente?.nombre || 'Cliente') : 'Selecciona una conversacion'}</CardTitle></CardHeader>
          <CardContent className='flex-1 overflow-y-auto space-y-2'>
            {mensajes.map((msg: any) => (
              <div key={msg.id} className={'flex ' + (msg.remitente_tipo === 'laboratorio' || msg.remitente_tipo === 'empleado' ? 'justify-end' : 'justify-start')}>
                <div className={'max-w-[70%] p-2 rounded-lg text-sm ' + (msg.remitente_tipo === 'laboratorio' || msg.remitente_tipo === 'empleado' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                  <p>{msg.contenido?.startsWith('Archivo: ') ? <a href={msg.contenido.replace('Archivo: ', '')} target='_blank' rel='noopener noreferrer' className='underline'>Ver archivo</a> : msg.contenido}</p>
                  <p className='text-xs opacity-70 mt-1'>{new Date(msg.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
          </CardContent>
          {conversacionActiva && (
            <div className='p-3 border-t flex gap-2 items-center'>
              <input type='file' id='chat-file' className='hidden' onChange={(e) => { const f = e.target.files?.[0]; if (f) enviarArchivo(f) }} />
              <Button variant='outline' size='icon' onClick={() => document.getElementById('chat-file')?.click()} disabled={enviandoArchivo}><Paperclip className='h-4 w-4' /></Button>
              <Input value={mensaje} onChange={(e) => setMensaje(e.target.value)} placeholder='Escribe un mensaje...' onKeyPress={(e) => e.key === 'Enter' && enviarMensaje()} />
              <Button onClick={enviarMensaje}><Send className='h-4 w-4' /></Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}