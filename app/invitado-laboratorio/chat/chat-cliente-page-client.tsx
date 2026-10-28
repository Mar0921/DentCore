'use client'

import { AppShell } from '@/components/dentcore/app-shell'
import { ChatWidget } from '@/components/dentcore/chat/chat-widget'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export function ChatClientePageClient() {
  const [clienteId, setClienteId] = useState<string | undefined>()
  const [laboratorioId, setLaboratorioId] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCliente()
  }, [])

  async function loadCliente() {
    try {
      const email = localStorage.getItem('labUserEmail')
      if (!email) return
      const { data } = await supabase.from('cliente').select('id, laboratorio_id').eq('email', email).maybeSingle()
      if (data) {
        setClienteId(data.id)
        setLaboratorioId(data.laboratorio_id)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell sidebar="invitado" showSidebar={false}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Chat con Laboratorio</h1>
        {!loading && clienteId && laboratorioId && <ChatWidget tipo="cliente" clienteId={clienteId} laboratorioId={laboratorioId} />}
        {!loading && (!clienteId || !laboratorioId) && <p className="text-muted-foreground">No se pudo cargar la información del chat.</p>}
      </div>
    </AppShell>
  )
}

export default ChatClientePageClient
