'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PrescriptionForm } from '@/components/dentcore/solicitud/prescription-form'
import { useLabUser } from '@/hooks/use-lab-user'
import { supabase } from '@/lib/supabase'
import { AppShell } from '@/components/dentcore/app-shell'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'

export default function InvitadoNuevaSolicitudPage() {
  const router = useRouter()
  const { userEmail } = useLabUser()
  const [odontologoPrecargado, setOdontologoPrecargado] = useState<{ nombre: string; email?: string; telefono?: string } | undefined>(undefined)

  useEffect(() => {
    if (!userEmail) return

    async function loadOdontologo() {
      try {
        const { data: odonto } = await supabase
          .from('odontologos')
          .select('nombre, email, telefono')
          .eq('email', userEmail)
          .maybeSingle()

        if (odonto?.nombre) {
          setOdontologoPrecargado({
            nombre: odonto.nombre,
            email: odonto.email || userEmail,
            telefono: odonto.telefono || '',
          })
          return
        }

        const { data: cliente } = await supabase
          .from('cliente')
          .select('nombre, email, telefono')
          .eq('email', userEmail)
          .maybeSingle()

        if (cliente?.nombre) {
          setOdontologoPrecargado({
            nombre: cliente.nombre,
            email: cliente.email || userEmail,
            telefono: cliente.telefono || '',
          })
        }
      } catch {
        // ignore
      }
    }

    loadOdontologo()
  }, [userEmail])

  return (
    <AppShell sidebar="invitado" showSidebar={false}>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="size-8" onClick={() => router.back()}>
            <ChevronLeft className="size-4" />
          </Button>
          <div>
            <h1 className="font-heading text-2xl font-bold text-primary">Nueva solicitud</h1>
            <p className="text-sm text-muted-foreground">Complete la información para generar la solicitud</p>
          </div>
        </div>
        <PrescriptionForm 
          redirectPath="/invitado-laboratorio/solicitudes" 
          odontologoPrecargado={odontologoPrecargado}
        />
      </div>
    </AppShell>
  )
}
