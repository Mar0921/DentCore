'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/dentcore/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useLabUser } from '@/hooks/use-lab-user'

export default function EmpleadoPerfilPage() {
  const { userName, userEmail, labName } = useLabUser()
  const [empleado, setEmpleado] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPerfil() {
      setLoading(true)
      try {
        const email = typeof window !== 'undefined' ? localStorage.getItem('labUserEmail') : null
        if (!email) return

        const { data } = await supabase
          .from('empleados')
          .select('*, laboratorio(*)')
          .eq('email', email)
          .maybeSingle()

        setEmpleado(data)
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }

    loadPerfil()
  }, [])

  return (
    <AppShell sidebar="empleado">
      <div className="space-y-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">Mi perfil</h1>
          <p className="text-sm text-muted-foreground">Información de tu cuenta</p>
        </div>

        {loading ? (
          <Card>
            <CardHeader><CardTitle>Cargando...</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Obteniendo tu información.</p>
            </CardContent>
          </Card>
        ) : empleado ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Datos personales</CardTitle></CardHeader>
              <CardContent className="grid gap-3">
                <Info label="Nombre" value={empleado.nombre || userName || '—'} />
                <Info label="Email" value={empleado.email || userEmail || '—'} />
                <Info label="Rol" value={empleado.rol || '—'} />
                <Info label="Teléfono" value={empleado.telefono || '—'} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Laboratorio</CardTitle></CardHeader>
              <CardContent className="grid gap-3">
                <Info label="Laboratorio" value={empleado.laboratorio?.nombre || labName || '—'} />
                <Info label="ID" value={empleado.laboratorio?.id || '—'} />
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardHeader><CardTitle>No se encontró tu perfil</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Inicia sesión para ver tu información.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="mt-0.5 block text-sm text-foreground break-words">{value}</span>
    </div>
  )
}
