'use client'

import { useEffect, useState } from 'react'
import { PrescriptionForm } from '@/components/dentcore/solicitud/prescription-form'
import { ProductosSelector } from '@/components/dentcore/solicitud/productos-selector'
import { useLabUser } from '@/hooks/use-lab-user'
import { supabase } from '@/lib/supabase'

export default function NuevaSolicitudPage() {
  const { userEmail, userName } = useLabUser()
  const [odontologoPrecargado, setOdontologoPrecargado] = useState<{ nombre: string; email?: string; telefono?: string } | undefined>(undefined)

  useEffect(() => {
    if (odontologoPrecargado) return

    async function loadOdontologo() {
      try {
        if (userEmail) {
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
            return
          }
        }

        if (userName) {
          setOdontologoPrecargado({
            nombre: userName,
            email: userEmail || '',
            telefono: '',
          })
        }
      } catch {
        // ignore
      }
    }

    loadOdontologo()
  }, [userEmail, userName, odontologoPrecargado])

  return (
    <div className="space-y-4">
      <PrescriptionForm           odontologoPrecargado={undefined} />
      <ProductosSelector />
    </div>
  )
}