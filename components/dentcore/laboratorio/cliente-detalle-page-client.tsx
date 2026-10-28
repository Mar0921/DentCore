'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Mail, Phone, Building2, FileText, ArrowLeft, CheckCircle, Clock } from 'lucide-react'

export function ClienteDetallePageClient() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [cliente, setCliente] = useState<any>(null)
  const [carta, setCarta] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) loadCliente()
  }, [id])

  async function loadCliente() {
    setLoading(true)
    try {
      const { data } = await supabase.from('cliente').select('*').eq('id', id).maybeSingle()
      if (data) setCliente(data)
      const { data: cartaData } = await supabase.from('cartas_convenio').select('*').eq('cliente_id', id).maybeSingle()
      if (cartaData) setCarta(cartaData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground">Cargando...</div>
  }

  if (!cliente) {
    return <div className="p-6 text-center text-muted-foreground">Cliente no encontrado</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="font-heading text-2xl font-bold text-primary">Perfil del Cliente</h1>
            <p className="text-sm text-muted-foreground">{cliente.nombre}</p>
          </div>
        </div>
        <Button onClick={() => window.open(`/laboratorio/carta-convenio?cliente=${cliente.id}`, '_blank')} className="gap-2">
          <FileText className="size-4" />
          Ver Carta Convenio
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5" />
            Datos del Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-2">
            <User className="size-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Nombre</p>
              <p className="text-sm font-medium">{cliente.nombre || 'â€”'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium">{cliente.email || 'â€”'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="size-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">TelÃ©fono</p>
              <p className="text-sm font-medium">{cliente.telefono || cliente.celular || 'â€”'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">ClÃ­nica</p>
              <p className="text-sm font-medium">{cliente.clinica || 'â€”'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Carta Convenio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {carta?.firmado ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="size-5" />
              <span className="font-medium">Carta convenio firmada</span>
            </div>
          ) : (
          <div className="flex items-center gap-2 text-amber-600">
            <Clock className="size-5" />
            <span className="font-medium">Pendiente de firma por el odontólogo</span>
          </div>
          )}
          {carta?.fecha_firma && (
            <p className="text-sm text-muted-foreground">
              Firmada el {new Date(carta.fecha_firma).toLocaleDateString('es-CO')} a las {new Date(carta.fecha_firma).toLocaleTimeString('es-CO')}
            </p>
          )}
          {carta?.firma_odontologo_data_url && (
            <div className="border rounded-lg p-4 bg-white max-w-xs">
              <p className="text-xs text-muted-foreground mb-2">Firma del odontólogo</p>
              <img src={carta.firma_odontologo_data_url} alt="Firma odontólogo" className="w-full h-20 object-contain" />
            </div>
          )}
          <Button onClick={() => window.open(`/laboratorio/carta-convenio?cliente=${cliente.id}`, '_blank')} variant="outline" className="gap-2">
            <FileText className="size-4" />
            Ver carta convenio
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
